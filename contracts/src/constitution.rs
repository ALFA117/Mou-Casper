use odra::casper_types::U512;
use odra::prelude::*;

/// Hard limits that the underwriter agents CANNOT bypass, no matter what the LLM
/// decides. This is what kills the "you gave real money to a hallucinating AI"
/// objection (Mou-Casper.md Section 4.1, contract #5). TrancheVault and
/// UnderwriterStake must call `assert_within_exposure` before moving capital.
#[odra::module]
pub struct Constitution {
    owner: Var<Address>,
    max_exposure_per_asset: Var<U512>,
    min_collateral_ratio_bps: Var<u32>,
    circuit_breaker_tripped: Var<bool>,
}

#[odra::module]
impl Constitution {
    pub fn init(&mut self, max_exposure_per_asset: U512, min_collateral_ratio_bps: u32) {
        self.owner.set(self.env().caller());
        self.max_exposure_per_asset.set(max_exposure_per_asset);
        self.min_collateral_ratio_bps.set(min_collateral_ratio_bps);
        self.circuit_breaker_tripped.set(false);
    }

    fn assert_owner(&self) {
        if self.env().caller() != self.owner.get_or_revert_with(ConstitutionError::NotInitialized)
        {
            self.env().revert(ConstitutionError::NotOwner);
        }
    }

    pub fn set_max_exposure_per_asset(&mut self, max_exposure: U512) {
        self.assert_owner();
        self.max_exposure_per_asset.set(max_exposure);
    }

    pub fn trip_circuit_breaker(&mut self) {
        self.assert_owner();
        self.circuit_breaker_tripped.set(true);
    }

    pub fn reset_circuit_breaker(&mut self) {
        self.assert_owner();
        self.circuit_breaker_tripped.set(false);
    }

    pub fn max_exposure_per_asset(&self) -> U512 {
        self.max_exposure_per_asset.get_or_default()
    }

    pub fn min_collateral_ratio_bps(&self) -> u32 {
        self.min_collateral_ratio_bps.get_or_default()
    }

    pub fn is_circuit_breaker_tripped(&self) -> bool {
        self.circuit_breaker_tripped.get_or_default()
    }

    /// Reverts if the requested exposure would break a hard limit. Called by
    /// TrancheVault before it accepts new collateral / issues new tranches.
    pub fn assert_within_exposure(&self, requested_exposure: U512) {
        if self.circuit_breaker_tripped.get_or_default() {
            self.env().revert(ConstitutionError::CircuitBreakerTripped);
        }
        if requested_exposure > self.max_exposure_per_asset.get_or_default() {
            self.env().revert(ConstitutionError::ExposureLimitExceeded);
        }
    }
}

#[odra::odra_error]
pub enum ConstitutionError {
    NotInitialized = 1,
    NotOwner = 2,
    CircuitBreakerTripped = 3,
    ExposureLimitExceeded = 4,
}

// NOTE: unit tests intentionally omitted here pending a working compiler toolchain
// (see README.md "Bloqueo de plataforma"). Add an `init` + `assert_within_exposure`
// happy/unhappy path test once `cargo odra test` can actually run on this machine.
