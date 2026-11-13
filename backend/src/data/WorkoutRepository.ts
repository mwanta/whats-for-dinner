import { SupabaseClient } from '@supabase/supabase-js'
import { throwIfError } from './supabaseErrors'

export type Workout = {
    name: string
    workoutType: string
    bearingType: string
    durationMin: number
    muscleGroups: string[]
    contraindications: string[]
    nutritionNotes?: string
}

export class WorkoutRepository {
    constructor(private supabase: SupabaseClient) {}

    async list(workoutType?: string): Promise<Workout[]> {
        let query = this.supabase.from('workouts').select('*')
        if (workoutType) query = query.eq('workout_type', workoutType)

        const { data, error } = await query
        throwIfError(error, 'workouts')

        return (data ?? []).map((w: any) => ({
            name: w.name,
            workoutType: w.workout_type,
            bearingType: w.bearing_type,
            durationMin: w.duration_min,
            muscleGroups: w.muscle_groups ?? [],
            contraindications: w.contraindications ?? [],
            nutritionNotes: w.nutrition_notes
        }))
    }
}
