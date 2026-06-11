import { SupabaseClient } from '@supabase/supabase-js'
import type { FullProfile } from '@whats-for-dinner/types'
import { ProfileService } from './ProfileService'
import { DietService } from './DietService'
import { InjuryService } from './InjuryService'
import { UserContextService } from './UserContextService'
import { MacroService } from './MacroService'

export class FullProfileService {
    private profileService: ProfileService
    private dietService: DietService
    private injuryService: InjuryService
    private contextService: UserContextService
    private macroService: MacroService

    constructor(private supabase: SupabaseClient) {
        this.profileService = new ProfileService(supabase)
        this.dietService = new DietService(supabase)
        this.injuryService = new InjuryService(supabase)
        this.contextService = new UserContextService(supabase)
        this.macroService = new MacroService(supabase)
    }

    async get(userId: string): Promise<FullProfile> {
        const [profile, diet, deficiencies, injuries, context, macros] = await Promise.all([
            this.profileService.getProfile(userId),
            this.dietService.getDietaryPreferences(userId),
            this.dietService.getDeficiencies(userId),
            this.injuryService.getActiveInjuries(userId),
            this.contextService.getContext(userId),
            this.macroService.getMacroTargets(userId)
        ])

        return { profile, diet, deficiencies, injuries, context, macros }
    }
}