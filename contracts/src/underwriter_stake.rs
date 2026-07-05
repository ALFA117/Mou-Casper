use odra::casper_types::U512;
use odra::prelude::*;

/// Each underwriter agent deposits real CSPR behind its own risk opinion. If the
/// asset it rated defaults beyond what it priced for, the Servicer/Monitor Agent
/// slashes a proportional slice of this stake. This is the mechanism: "the AI
/// bleeds when it lies." (Mou-Casper.md Section 4.1, contract #3.)
#[odra::module]
pub struct UnderwriterStake {
    owner: Var<Address>,
    stakes: Mapping<Address, U512>,
}

#[odra::module]
impl UnderwriterStake {
    pub fn init(&mut self) {
        self.owner.set(self.env().caller());
    }

    fn assert_owner(&self) {
        if self.env().caller() != self.owner.get_or_revert_with(StakeError::NotInitialized) {
            self.env().revert(StakeError::NotOwner);
        }
    }

    /// Underwriter deposits CSPR as collateral behind their own risk quote.
    #[odra(payable)]
    pub fn stake(&mut self) {
        let caller = self.env().caller();
        let amount = self.env().attached_value();
        let current = self.stakes.get(&caller).unwrap_or_default();
        self.stakes.set(&caller, current + amount);
    }

    pub fn stake_of(&self, underwriter: Address) -> U512 {
        self.stakes.get(&underwriter).unwrap_or_default()
    }

    /// Servicer/Monitor-triggered slashing after a simulated default: cuts `bps`
    /// (basis points, out of 10 000) of the underwriter's current stake and
    /// forwards it to `beneficiary` (the TrancheVault, to cover investor losses).
    pub fn slash(&mut self, underwriter: Address, bps: u32, beneficiary: Address) -> U512 {
        self.assert_owner();
        let current = self.stakes.get(&underwriter).unwrap_or_default();
        let slashed = current * U512::from(bps) / U512::from(10_000u32);
        self.stakes.set(&underwriter, current - slashed);
        if slashed > U512::zero() {
            self.env().transfer_tokens(&beneficiary, &slashed);
        }
        slashed
    }

    /// Lets an underwriter withdraw stake that wasn't slashed (e.g. after a batch
    /// resolves cleanly).
    pub fn withdraw(&mut self, amount: U512) {
        let caller = self.env().caller();
        let current = self.stakes.get(&caller).unwrap_or_default();
        if amount > current {
            self.env().revert(StakeError::InsufficientStake);
        }
        self.stakes.set(&caller, current - amount);
        self.env().transfer_tokens(&caller, &amount);
    }
}

#[odra::odra_error]
pub enum StakeError {
    NotInitialized = 1,
    NotOwner = 2,
    InsufficientStake = 3,
}
