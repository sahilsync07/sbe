export const COLOR_MAP = {
    // BLACKS
    'BLK': { color: '#1f2937', label: 'Black' }, // Gray-800
    'BLACK': { color: '#1f2937', label: 'Black' },
    'BK': { color: '#1f2937', label: 'Black' },
    'FBK': { color: '#000000', label: 'Full Black' }, // Jet black

    // WHITES (Darker text for visibility, or handle bg)
    'WHT': { color: '#94a3b8', label: 'White' }, // Slate-400 for visibility on white bg
    'WHITE': { color: '#94a3b8', label: 'White' },
    'WT': { color: '#94a3b8', label: 'White' },

    // GREYS
    'GRY': { color: '#6b7280', label: 'Grey' }, // Gray-500
    'GREY': { color: '#6b7280', label: 'Grey' },
    'L.GRY': { color: '#9ca3af', label: 'Light Grey' }, // Gray-400
    'D.GRY': { color: '#4b5563', label: 'Dark Grey' }, // Gray-600
    'D.GREY': { color: '#4b5563', label: 'Dark Grey' },
    'MOUSE': { color: '#78716c', label: 'Mouse' }, // Stone-500

    // BLUES
    'BLU': { color: '#3b82f6', label: 'Blue' }, // Blue-500
    'BLUE': { color: '#3b82f6', label: 'Blue' },
    'NAVY': { color: '#1e3a8a', label: 'Navy' }, // Blue-900
    'NVY': { color: '#1e3a8a', label: 'Navy' },
    'NV': { color: '#1e3a8a', label: 'Navy' },
    'R.BLUE': { color: '#2563eb', label: 'Royal Blue' }, // Blue-600
    'P.BLU': { color: '#0891b2', label: 'Peacock' }, // Cyan-600
    'PCOOK': { color: '#0891b2', label: 'Peacock' },
    'P.COCK': { color: '#0891b2', label: 'Peacock' },
    'PCOCK': { color: '#0891b2', label: 'Peacock' },
    'P': { color: '#0891b2', label: 'Peacock' },
    'SKY': { color: '#0ea5e9', label: 'Sky' }, // Sky-500
    'TURQ': { color: '#06b6d4', label: 'Turquoise' }, // Cyan-500
    'DNM': { color: '#3730a3', label: 'Denim' }, // Indigo-800

    // REDS
    'RED': { color: '#ef4444', label: 'Red' }, // Red-500
    'RD': { color: '#ef4444', label: 'Red' },
    'MRN': { color: '#991b1b', label: 'Maroon' }, // Red-800
    'MAROON': { color: '#991b1b', label: 'Maroon' },
    'CHERRY': { color: '#9f1239', label: 'Cherry' }, // Rose-800
    'WINE': { color: '#881337', label: 'Wine' }, // Rose-900
    'GRP': { color: '#881337', label: 'Grape' }, // Rose-900
    'GRAPE': { color: '#881337', label: 'Grape' }, // Rose-900
    'GRAP': { color: '#881337', label: 'Grape' }, // Rose-900



    // GREENS
    'GRN': { color: '#10b981', label: 'Green' }, // Emerald-500
    'GREEN': { color: '#10b981', label: 'Green' },
    'OLV': { color: '#65a30d', label: 'Olive' }, // Lime-600
    'OLIVE': { color: '#65a30d', label: 'Olive' },
    'MEHENDI': { color: '#4d7c0f', label: 'Mehendi' }, // Lime-700
    'PISTA': { color: '#86efac', label: 'Pista' }, // Green-300
    'SGN': { color: '#6ee7b7', label: 'Sage' }, // Emerald-300
    'F.GRN': { color: '#15803d', label: 'Forest' }, // Green-700
    'R.GRN': { color: '#15803d', label: 'R.Green' },

    // YELLOWS
    'YEL': { color: '#eab308', label: 'Yellow' }, // Yellow-500
    'YLW': { color: '#eab308', label: 'Yellow' },
    'YELLOW': { color: '#eab308', label: 'Yellow' },
    'MUSTARD': { color: '#ca8a04', label: 'Mustard' }, // Yellow-600
    'MST': { color: '#ca8a04', label: 'Mustard' },
    'LEMON': { color: '#facc15', label: 'Lemon' }, // Yellow-400

    // PINKS/PURPLES
    'PNK': { color: '#ec4899', label: 'Pink' }, // Pink-500
    'PINK': { color: '#ec4899', label: 'Pink' },
    'BP': { color: '#f472b6', label: 'Baby Pink' }, // Pink-400
    'BABY PINK': { color: '#f472b6', label: 'Baby Pink' },
    'RANI': { color: '#db2777', label: 'Rani' }, // Pink-600
    'PEACH': { color: '#fb7185', label: 'Peach' }, // Rose-400
    'ONION': { color: '#c084fc', label: 'Onion' }, // Purple-400
    'MAUVE': { color: '#d8b4fe', label: 'Mauve' }, // Purple-300
    'PURPLE': { color: '#a855f7', label: 'Purple' }, // Purple-500
    'VIOLT': { color: '#7c3aed', label: 'Violet' }, // Violet-600

    // BROWNS/BEIGES
    'BRN': { color: '#78350f', label: 'Brown' }, // Amber-900
    'BROWN': { color: '#78350f', label: 'Brown' },
    'BGE': { color: '#d6d3d1', label: 'Beige' }, // Stone-300 (darker for text)
    'BEIGE': { color: '#a8a29e', label: 'Beige' }, // Stone-400
    'BEG': { color: '#a8a29e', label: 'Beige' },
    'TAN': { color: '#d4a373', label: 'Tan' },
    'CJK': { color: '#d4a373', label: 'Chikoo' },
    'CHIKOO': { color: '#d4a373', label: 'Chikoo' },
    'CHIKKU': { color: '#a16d48', label: 'Chikoo' },
    'CHIKU': { color: '#a16d48', label: 'Chikoo' },
    'CAMEL': { color: '#d97706', label: 'Camel' }, // Amber-600
    'KHAKI': { color: '#a3a3a3', label: 'Khaki' },
    'CRM': { color: '#d4d4d4', label: 'Cream' }, // Neutral-300 (darker for text)
    'CREAM': { color: '#d4d4d4', label: 'Cream' },
    'S.TAN': { color: '#d4a373', label: 'S.Tan' },
    'FOSSIL': { color: '#b8a590', label: 'Fossil' },
    'FSL': { color: '#b8a590', label: 'Fossil' },
    'BISCUIT': { color: '#ddb892', label: 'Biscuit' },
    'BIS': { color: '#ddb892', label: 'Biscuit' },
    'BISCUITE': { color: '#ddb892', label: 'Biscuit' },
    'COFFEE': { color: '#6f4e37', label: 'Coffee' },
    'COFFE': { color: '#6f4e37', label: 'Coffee' },

    // METALLICS
    'GLD': { color: '#ca8a04', label: 'Gold' }, // Yellow-600
    'GOLD': { color: '#ca8a04', label: 'Gold' },
    'COPPER': { color: '#b45309', label: 'Copper' }, // Amber-700
    'SLVR': { color: '#64748b', label: 'Silver' }, // Slate-500
    'SILVER': { color: '#64748b', label: 'Silver' },

    // MIX
    'MIX': { color: '#6366f1', label: 'Mix' }, // Indigo-500 (General)
    'MULTI': { color: '#6366f1', label: 'Multi' },
};

export const COLOR_KEYS = Object.keys(COLOR_MAP).sort((a, b) => b.length - a.length); // Match longest first

export function extractColor(productName) {
    if (!productName) return null;

    // We look for color tokens. 
    // We also handle combinations like BLK/RED.

    const tokens = productName.toUpperCase().split(/[\s\(\)\-\/]+/);
    const foundTokens = [];
    const foundLabels = [];

    // First pass: Direct matches
    for (const token of tokens) {
        if (COLOR_MAP[token]) {
            foundTokens.push(token);
            foundLabels.push(COLOR_MAP[token].label);
        }
    }

    // If we found colors, we format them.
    // If multiple, we join them.
    if (foundTokens.length > 0) {
        // De-duplicate
        const uniqueTokens = [...new Set(foundTokens)];
        const uniqueLabels = [...new Set(foundLabels)];

        // Find the primary color for text styling (first one found is usually dominant)
        const primaryKey = uniqueTokens[0];
        const primaryData = COLOR_MAP[primaryKey];

        return {
            text: uniqueLabels.join(' & '),
            hex: primaryData.color,
            originalTokens: uniqueTokens
        };
    }

    return null;
}
