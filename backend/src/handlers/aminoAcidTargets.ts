// Daily essential amino acid requirements, scaled by body weight.
import type { AminoAcidTargets } from '@whats-for-dinner/types'

/**
 * Adult requirements in mg per kg body weight per day. Source: WHO/FAO/UNU,
 * "Protein and amino acid requirements in human nutrition", Technical Report
 * Series 935 (2007), Table 23. Methionine and phenylalanine are combined with
 * cysteine and tyrosine because that's how the requirements are defined.
 */
export const WHO_2007_MG_PER_KG: Record<keyof AminoAcidTargets, number> = {
    histidineMg: 10,
    isoleucineMg: 20,
    leucineMg: 39,
    lysineMg: 30,
    methionineCysteineMg: 15,
    phenylalanineTyrosineMg: 25,
    threonineMg: 15,
    tryptophanMg: 4,
    valineMg: 26,
}

export function calculateAminoAcidTargets(weightKg: number): AminoAcidTargets {
    const entries = Object.entries(WHO_2007_MG_PER_KG).map(
        ([key, mgPerKg]) => [key, Math.round(mgPerKg * weightKg)]
    )
    return Object.fromEntries(entries) as AminoAcidTargets
}
