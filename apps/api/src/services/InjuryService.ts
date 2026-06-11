import { SupabaseClient } from '@supabase/supabase-js'
import { Injury, INJURY_TYPES} from '@whats-for-dinner/types'

export class InjuryService {
    constructor(private supabase: SupabaseClient) {}

    async getActiveInjuries(userId: string): Promise<Injury[]> {
        const { data, error } = await this.supabase
            .from('injuries')
            .select('*')
            .eq('user_id', userId)
            .eq('active', true)

        if (error) throw new Error(error.message)

        return (data ?? []).map((i: any) => ({
            id: i.id,
            bodyPart: i.body_part,
            injuryType: i.injury_type,
            severity: i.severity,
            restrictions: i.restrictions ?? [],
            nutritionNotes: i.nutrition_notes,
            active: i.active
        }))
    }

    async saveInjuries(userId: string, injuries: Omit<Injury, 'id'>[]): Promise<void> {
        if (!Array.isArray(injuries)) {
            throw new Error('injuries must be an array')
        }
        for (const injury of injuries) {
            if (!INJURY_TYPES.includes(injury.injuryType)) {
                throw new Error(`injuryType must be one of: ${INJURY_TYPES.join(', ')}`)
            }
            if (!Array.isArray(injury.restrictions)) {
                throw new Error('restrictions must be an array')
            }
        }

        await this.supabase.from('injuries').delete().eq('user_id', userId)

        if (injuries.length > 0) {
            const { error } = await this.supabase.from('injuries').insert(
                injuries.map(i => ({
                    user_id: userId,
                    body_part: i.bodyPart,
                    injury_type: i.injuryType,
                    restrictions: i.restrictions,
                    active: true
                }))
            )
            if (error) throw new Error(error.message)
        }
    }

    async getAllRestrictions(userId: string): Promise<string[]> {
        const injuries = await this.getActiveInjuries(userId)
        return [...new Set(injuries.flatMap(i => i.restrictions))]
    }

    async getNutritionNotes(userId: string): Promise<string[]> {
        const injuries = await this.getActiveInjuries(userId)
        return injuries
            .map(i => i.nutritionNotes)
            .filter((n): n is string => !!n)
    }
}