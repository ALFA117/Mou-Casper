use odra::casper_types::U512;
use odra::prelude::*;

/// One collateral batch (invoices/receivables), split into senior (low risk/low
/// yield, paid first) and junior (high risk/high yield, absorbs losses first)
/// tranches, with a waterfall payout on default. MVP-scoped to a single asset
/// batch and two tranches per Mou-Casper.md Section 7 — no secondary market, no
/// multi-asset pooling.
#[odra::module]
pub struct TrancheVault {
    owner: Var<Address>,
    senior_face_value: Var<U512>,
    junior_face_value: Var<U512>,
    senior_outstanding: Var<U512>,
    junior_outstanding: Var<U512>,
    senior_holders: Mapping<Address, U512>,
    junior_holders: Mapping<Address, U512>,
    defaulted: Var<bool>,
}

#[odra::module]
impl TrancheVault {
    /// Face values denominated in motes (CSPR's smallest unit) for the demo.
    pub fn init(&mut self, senior_face_value: U512, junior_face_value: U512) {
        self.owner.set(self.env().caller());
        self.senior_face_value.set(senior_face_value);
        self.junior_face_value.set(junior_face_value);
        self.senior_outstanding.set(senior_face_value);
        self.junior_outstanding.set(junior_face_value);
        self.defaulted.set(false);
    }

    fn assert_owner(&self) {
        if self.env().caller() != self.owner.get_or_revert_with(VaultError::NotInitialized) {
            self.env().revert(VaultError::NotOwner);
        }
    }

    /// Investor Agent buys into the senior tranche by attaching CSPR.
    #[odra(payable)]
    pub fn buy_senior(&mut self) {
        let caller = self.env().caller();
        let amount = self.env().attached_value();
        let current = self.senior_holders.get(&caller).unwrap_or_default();
        self.senior_holders.set(&caller, current + amount);
    }

    /// Investor Agent buys into the junior tranche by attaching CSPR.
    #[odra(payable)]
    pub fn buy_junior(&mut self) {
        let caller = self.env().caller();
        let amount = self.env().attached_value();
        let current = self.junior_holders.get(&caller).unwrap_or_default();
        self.junior_holders.set(&caller, current + amount);
    }

    pub fn senior_outstanding(&self) -> U512 {
        self.senior_outstanding.get_or_default()
    }

    pub fn junior_outstanding(&self) -> U512 {
        self.junior_outstanding.get_or_default()
    }

    pub fn holding_of_senior(&self, investor: Address) -> U512 {
        self.senior_holders.get(&investor).unwrap_or_default()
    }

    pub fn holding_of_junior(&self, investor: Address) -> U512 {
        self.junior_holders.get(&investor).unwrap_or_default()
    }

    pub fn is_defaulted(&self) -> bool {
        self.defaulted.get_or_default()
    }

    /// THE CLIMAX (Mou-Casper.md Section 8, step 4): Servicer/Monitor Agent marks
    /// a simulated default with a loss amount. The waterfall hits junior first;
    /// only once junior is fully wiped does the remaining loss spill into senior.
    /// Returns (junior_hit, senior_hit) so the caller can drive the UnderwriterStake
    /// slash and the dashboard animation off the same numbers.
    pub fn mark_default(&mut self, loss_amount: U512) -> (U512, U512) {
        self.assert_owner();
        self.defaulted.set(true);

        let junior = self.junior_outstanding.get_or_default();
        let junior_hit = core::cmp::min(junior, loss_amount);
        self.junior_outstanding.set(junior - junior_hit);

        let remaining_loss = loss_amount - junior_hit;
        let senior = self.senior_outstanding.get_or_default();
        let senior_hit = core::cmp::min(senior, remaining_loss);
        self.senior_outstanding.set(senior - senior_hit);

        (junior_hit, senior_hit)
    }
}

#[odra::odra_error]
pub enum VaultError {
    NotInitialized = 1,
    NotOwner = 2,
}
