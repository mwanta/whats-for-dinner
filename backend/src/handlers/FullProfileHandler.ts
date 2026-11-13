import type { FullProfile } from '@whats-for-dinner/types'
import type { ProfileHandler } from './ProfileHandler'
import type { DietHandler } from './DietHandler'
import type { InjuryHandler } from './InjuryHandler'
import type { UserContextHandler } from './UserContextHandler'
import type { MacroHandler } from './MacroHandler'

export class FullProfileHandler {
    constructor(
        private readonly profileHandler: ProfileHandler,
        private readonly dietHandler: DietHandler,
        private readonly injuryHandler: InjuryHandler,
        private readonly contextHandler: UserContextHandler,
        private readonly macroHandler: MacroHandler
    ) {}

    async get(userId: string): Promise<FullProfile> {
        const [profile, diet, deficiencies, injuries, context, macros] = await Promise.all([
            this.profileHandler.getProfile(userId),
            this.dietHandler.getDietaryPreferences(userId),
            this.dietHandler.getDeficiencies(userId),
            this.injuryHandler.getActiveInjuries(userId),
            this.contextHandler.getContext(userId),
            this.macroHandler.getMacroTargets(userId)
        ])

        return { profile, diet, deficiencies, injuries, context, macros }
    }
}
