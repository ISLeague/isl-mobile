export const getLogoUri = (logoPath?: string | null) => {
    if (!logoPath) return null;

    // If it already starts with http, use it directly
    if (logoPath.startsWith('http')) {
        return { uri: logoPath };
    }

    // For non-http paths, try to construct full Supabase URL
    // The bucket might be 'equipos' or 'logos' - we'll try logos first
    const SUPABASE_PROJECT_ID = 'htjksrcbpozlgjqpqguw';
    const STORAGE_BASE = `https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public`;

    // Clean path
    let cleanPath = logoPath.startsWith('/') ? logoPath.substring(1) : logoPath;

    // If the path already looks like bucket/path, use it
    // Otherwise assume it should go in the 'logos' bucket
    if (cleanPath.includes('/')) {
        return { uri: `${STORAGE_BASE}/${cleanPath}` };
    }

    return { uri: `${STORAGE_BASE}/logos/${cleanPath}` };
};
