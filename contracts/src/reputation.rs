use odra::prelude::*;

/// On-chain score (0-1000) that weights how much an underwriter agent's opinion
/// is worth and how much pricing power it gets. Falls when an agent is slashed,
/// rises when its calls hold up. (Mou-Casper.md Section 4.1, contract #4.)
#[odra::module]
pub struct Reputation {
    owner: Var<Address>,
    scores: Mapping<Address, u32>,
}

const DEFAULT_SCORE: u32 = 500;
const MAX_SCORE: u32 = 1000;

#[odra::module]
impl Reputation {
    pub fn init(&mut self) {
        self.owner.set(self.env().caller());
    }

    fn assert_owner(&self) {
        if self.env().caller() != self.owner.get_or_revert_with(ReputationError::NotInitialized) {
            self.env().revert(ReputationError::NotOwner);
        }
    }

    /// Registers a new underwriter at a neutral starting score.
    pub fn register(&mut self, underwriter: Address) {
        self.assert_owner();
        if self.scores.get(&underwriter).is_none() {
            self.scores.set(&underwriter, DEFAULT_SCORE);
        }
    }

    pub fn score_of(&self, underwriter: Address) -> u32 {
        self.scores.get(&underwriter).unwrap_or(DEFAULT_SCORE)
    }

    /// Called after a slashing event: knocks the misjudging underwriter's score down.
    pub fn penalize(&mut self, underwriter: Address, points: u32) {
        self.assert_owner();
        let current = self.score_of(underwriter);
        self.scores.set(&underwriter, current.saturating_sub(points));
    }

    /// Rewards an underwriter whose rating held up.
    pub fn reward(&mut self, underwriter: Address, points: u32) {
        self.assert_owner();
        let current = self.score_of(underwriter);
        self.scores.set(&underwriter, core::cmp::min(MAX_SCORE, current + points));
    }

    /// Pricing power derived from reputation: score/1000 as basis points (0-10000).
    pub fn pricing_power_bps(&self, underwriter: Address) -> u32 {
        self.score_of(underwriter) * 10
    }
}

#[odra::odra_error]
pub enum ReputationError {
    NotInitialized = 1,
    NotOwner = 2,
}
