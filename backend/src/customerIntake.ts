import type { AcademyPublicationAssets, PublicationAssetSource } from "./types.js";

export type CustomerHomepageIntakeAssetSource = Exclude<PublicationAssetSource, "SAMPLE">;

export interface CustomerHomepageIntakeAssets {
  logoAssetId?: string;
  logoSource?: CustomerHomepageIntakeAssetSource;
  logoUsageConfirmed: boolean;
  logoTextFallbackApproved: boolean;
  heroPhotoAssetId?: string;
  heroPhotoSource?: CustomerHomepageIntakeAssetSource;
  heroPhotoUsageConfirmed: boolean;
  classroomPhotoAssetIds?: string[];
}

function normalizeOptionalAssetId(assetId: string | undefined): string | undefined {
  const normalized = assetId?.trim();
  return normalized ? normalized : undefined;
}

export function mapIntakeAssetsToPublicationAssets(assets: CustomerHomepageIntakeAssets): AcademyPublicationAssets {
  const logoAssetId = normalizeOptionalAssetId(assets.logoAssetId);
  const heroAssetId = normalizeOptionalAssetId(assets.heroPhotoAssetId);

  return {
    logo: {
      assetId: logoAssetId,
      source: logoAssetId ? assets.logoSource ?? "CUSTOMER_PROVIDED" : "MUKSAN_CREATED",
      approvedForPublish: logoAssetId ? assets.logoUsageConfirmed : false,
      textFallbackApproved: assets.logoTextFallbackApproved
    },
    hero: {
      assetId: heroAssetId,
      source: heroAssetId ? assets.heroPhotoSource ?? "CUSTOMER_PROVIDED" : "MUKSAN_APPROVED_REPLACEMENT",
      approvedForPublish: heroAssetId ? assets.heroPhotoUsageConfirmed : false
    }
  };
}
