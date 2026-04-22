const parseNaturalLanguageQuery = (query) => {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return null;
    }

    const q = query.toLowerCase().trim();
    const filters = {};

    if (/\bmale\b/.test(q) || /\bman\b/.test(q) || /\bmen\b/.test(q) || /\bboys\b/.test(q) || /\bboy\b/.test(q)) {
        filters.gender = 'male';
    } else if (/\bfemale\b/.test(q) || /\bwoman\b/.test(q) || /\bwomen\b/.test(q) || /\bgirls\b/.test(q) || /\bgirl\b/.test(q)) {
        filters.gender = 'female';
    }

    if (/\bchild|children|kid|kids\b/.test(q)) {
        filters.age_group = 'child';
    } else if (/\bteenager|teens|teenager\b/.test(q)) {
        filters.age_group = 'teenager';
    } else if (/\badult|adults\b/.test(q)) {
        filters.age_group = 'adult';
    } else if (/\bsenior|seniors|elderly|old\b/.test(q)) {
        filters.age_group = 'senior';
    }

    const ageAboveMatch = q.match(/(?:above|over|older than|at least)\s+(\d+)/);
    if (ageAboveMatch) {
        filters.min_age = parseInt(ageAboveMatch[1]);
    }

    // "below X", "under X", "younger than X"
    const ageBelowMatch = q.match(/(?:below|under|younger than)\s+(\d+)/);
    if (ageBelowMatch) {
        filters.max_age = parseInt(ageBelowMatch[1]);
    }

    if (/\byoung\b/.test(q) && !filters.age_group) {
        filters.min_age = 16;
        filters.max_age = 24;
    }

    const countryMap = {
        'nigeria': 'NG', 'nigerian': 'NG', 'nigerians': 'NG',
        'kenya': 'KE', 'kenyan': 'KE', 'kenyans': 'KE',
        'uganda': 'UG', 'ugandan': 'UG', 'ugandans': 'UG',
        'ghana': 'GH', 'ghanaian': 'GH', 'ghanaians': 'GH',
        'south africa': 'ZA', 'sa': 'ZA', 'south african': 'ZA', 'south africans': 'ZA',
        'tanzania': 'TZ', 'tanzanian': 'TZ', 'tanzanians': 'TZ',
        'ethiopia': 'ET', 'ethiopian': 'ET', 'ethiopians': 'ET',
        'cameroon': 'CM', 'cameroonian': 'CM', 'cameroonians': 'CM',
        'benin': 'BJ', 'beninese': 'BJ',
        'angola': 'AO', 'angolan': 'AO', 'angolans': 'AO',
        'sudan': 'SD', 'sudanese': 'SD',
        'united states': 'US', 'usa': 'US', 'us': 'US', 'american': 'US', 'americans': 'US',
        'united kingdom': 'GB', 'uk': 'GB', 'british': 'GB',
        'canada': 'CA', 'canadian': 'CA', 'canadians': 'CA',
        'india': 'IN', 'indian': 'IN', 'indians': 'IN',
        'france': 'FR', 'french': 'FR',
        'germany': 'DE', 'german': 'DE', 'germans': 'DE',
        'spain': 'ES', 'spanish': 'ES',
        'italy': 'IT', 'italian': 'IT', 'italians': 'IT',
        'japan': 'JP', 'japanese': 'JP',
        'china': 'CN', 'chinese': 'CN',
        'brazil': 'BR', 'brazilian': 'BR', 'brazilians': 'BR',
        'mexico': 'MX', 'mexican': 'MX', 'mexicans': 'MX',
        'australia': 'AU', 'australian': 'AU', 'australians': 'AU',
    };

    const countryMatch = q.match(/from\s+([a-z\s]+?)(?:\s+\b|$)/);
    if (countryMatch) {
        const countryName = countryMatch[1].trim();
        if (countryMap[countryName]) {
            filters.country_id = countryMap[countryName];
        }

    for (const [country, code] of Object.entries(countryMap)) {
        if (q.includes(country) && !filters.country_id) {
            filters.country_id = code;
            break;
        }
    }

    if (Object.keys(filters).length === 0) {
        return null;
    }

    return filters;
}};

export default parseNaturalLanguageQuery;
