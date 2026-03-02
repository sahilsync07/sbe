# Color Extraction and `Color.kt` Generation Task

Your task is to analyze the `stock-data.json` file, identify color abbreviations/names, and generate a `Color.kt` file containing a comprehensive mapping so that colors can be automatically detected from codes in the rest of the application.

## Step 1: Manual Mapping Integration
First, ensure that the following known color abbreviations and their corresponding names are explicitly included in your mapping logic.

**Known Mappings:**
*   `mhd` -> Mehandi
*   `chr` -> Cherry
*   `ppl` -> Purple
*   `F green` -> Forest Green
*   `lav` -> Lavender
*   `pch` -> Peach
*   `ltp` -> Light Pink (Note: also verify if it means Light Brown in some contexts, as both were mentioned)
*   `onn` -> Onion
*   `snd` -> Sand
*   `plm` -> Plum
*   `cml` -> Camel
*   `maj` -> Magenta
*   `brz` -> Brass
*   `mar` -> Maroon
*   `brt` -> Brown Tan
*   `tbr` -> Tan Brown
*   `nyb` -> Navy Blue
*   `dbn` -> Dark Brown
*   `mig` -> Military Green
*   `tlb` -> Teal Blue
*   `gyb` -> Grey Blue
*   `bnr` -> Barn Red
*   `bnb` -> Brown Beige
*   `bgy` -> Blue Grey
*   `bkt` -> Black Tan
*   `bbg` -> Black Beige
*   `fgn` -> Forest Green

## Step 2: Intelligent Extraction from `stock-data.json`
1.  **Parse the JSON:** Go through `stock-data.json`.
2.  **Pattern Recognition:** Identify variations of the known colors and any other potential color codes/names.
3.  **Handle Variations:** The extraction logic must account for multiple case sensitivities, writing styles, varying spacing, and hyphens (e.g., `NYB`, `ny b`, `Nyb`, `NavyBlue`, `navy-blue` should all map to "Navy Blue").

## Step 3: Discovery of New Colors
While analyzing `stock-data.json`, if you identify any new abbreviations, codes, or shortcuts that appear to represent a color but are **not** present in the "Known Mappings" list above:
*   **DO NOT** automatically assume their meaning if ambiguous.
*   **PAUSE AND ASK THE USER:** Present the newly discovered codes to the user and ask for their corresponding full color names before finalizing the `Color.kt` file.

## Step 4: Generate `Color.kt`
Finally, construct a `Color.kt` Kotlin file. This file should ideally contain an `enum class` or a robust `map`/utility function that takes any variation of a color string (extracted from the json/API) and safely normalizes it to the standard color name or hex code.
