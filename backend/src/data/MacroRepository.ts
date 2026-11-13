import { SupabaseClient } from '@supabase/supabase-js'
import type { MacroTargets } from '@whats-for-dinner/types'
import { throwIfError } from './supabaseErrors'

// macro_targets columns. methionine_mg and phenylalanine_mg hold the combined
// methionine+cysteine and phenylalanine+tyrosine requirements (see AminoAcidTargets).
const COLUMNS: Record<keyof MacroTargets, string> = {
    calories: 'calories',
    proteinG: 'protein_g',
    carbsG: 'carbs_g',
    fatG: 'fat_g',
    fiberG: 'fiber_g',
    histidineMg: 'histidine_mg',
    isoleucineMg: 'isoleucine_mg',
    leucineMg: 'leucine_mg',
    lysineMg: 'lysine_mg',
    methionineCysteineMg: 'methionine_mg',
    phenylalanineTyrosineMg: 'phenylalanine_mg',
    threonineMg: 'threonine_mg',
    tryptophanMg: 'tryptophan_mg',
    valineMg: 'valine_mg',
}
const FIELDS = Object.keys(COLUMNS) as (keyof MacroTargets)[]

export class MacroRepository {
    constructor(private supabase: SupabaseClient) {}

    async get(userId: string): Promise<MacroTargets> {
        const { data, error } = await this.supabase
            .from('macro_targets')
            .select('*')
            .eq('user_id', userId)
            .single()

        throwIfError(error, 'macro targets')

        return Object.fromEntries(FIELDS.map(f => [f, data[COLUMNS[f]]])) as MacroTargets
    }

    async upsert(userId: string, targets: MacroTargets): Promise<void> {
        const row = Object.fromEntries(FIELDS.map(f => [COLUMNS[f], targets[f]]))
        const { error } = await this.supabase
            .from('macro_targets')
            .upsert({ user_id: userId, ...row }, { onConflict: 'user_id' })

        throwIfError(error, 'macro targets')
    }
}
