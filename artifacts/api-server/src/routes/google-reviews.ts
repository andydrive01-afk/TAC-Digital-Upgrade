import { Router, type IRouter } from "express";

const router: IRouter = Router();

const API_KEY = process.env["GOOGLE_PLACES_API_KEY"];
const STATIC_PLACE_ID = process.env["GOOGLE_PLACE_ID"];
const SEARCH_QUERY = process.env["GOOGLE_PLACE_SEARCH_QUERY"] ?? "TAC Telecom Jaguaruna SC";

let cachedPlaceId: string | null = STATIC_PLACE_ID ?? null;

type Review = {
  authorName: string;
  authorPhoto: string;
  rating: number;
  text: string;
  relativeTime: string;
};

type ReviewsPayload = {
  configured: true;
  rating: number;
  totalRatings: number;
  reviews: Review[];
  writeReviewUrl: string;
} | {
  configured: false;
};

let cachedPayload: ReviewsPayload | null = null;
let cacheExpiry = 0;

async function discoverPlaceId(): Promise<string | null> {
  if (cachedPlaceId) return cachedPlaceId;
  if (!API_KEY) return null;

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": "places.id",
    },
    body: JSON.stringify({ textQuery: SEARCH_QUERY }),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as { places?: { id: string }[] };
  const placeId = data.places?.[0]?.id ?? null;
  if (placeId) cachedPlaceId = placeId;
  return placeId;
}

async function buildPayload(): Promise<ReviewsPayload | null> {
  if (!API_KEY) return { configured: false };

  const placeId = await discoverPlaceId();
  if (!placeId) return null;

  const res = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}?languageCode=pt-BR`,
    {
      headers: {
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": "reviews,rating,userRatingCount",
      },
    }
  );

  if (!res.ok) return null;

  const data = (await res.json()) as {
    rating?: number;
    userRatingCount?: number;
    reviews?: Array<{
      rating: number;
      text?: { text: string };
      authorAttribution?: { displayName: string; photoUri?: string };
      relativePublishTimeDescription?: string;
    }>;
  };

  const reviews: Review[] = (data.reviews ?? [])
    .filter(r => r.text?.text)
    .map(r => ({
      authorName: r.authorAttribution?.displayName ?? "Anônimo",
      authorPhoto: r.authorAttribution?.photoUri ?? "",
      rating: r.rating,
      text: r.text!.text,
      relativeTime: r.relativePublishTimeDescription ?? "",
    }));

  return {
    configured: true,
    rating: data.rating ?? 0,
    totalRatings: data.userRatingCount ?? 0,
    reviews,
    writeReviewUrl: `https://search.google.com/local/writereview?placeid=${placeId}`,
  };
}

router.get("/google-reviews", async (req, res) => {
  if (cachedPayload && Date.now() < cacheExpiry) {
    res.json(cachedPayload);
    return;
  }

  try {
    const payload = await buildPayload();
    if (!payload) {
      res.status(502).json({ error: "Não foi possível buscar as avaliações" });
      return;
    }

    cachedPayload = payload;
    cacheExpiry = Date.now() + 60 * 60 * 1000;
    res.json(payload);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch Google reviews");
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
