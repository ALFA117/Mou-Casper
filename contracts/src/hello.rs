use odra::prelude::*;

/// Trivial sanity-check contract (brief Fase 0 / paso 3): deploy this first and
/// confirm a real tx on Testnet CSPR.live before writing any AVAL business logic.
/// If this deploy fails with `invalid pricing mode`, fix the pricing mode/version
/// mismatch here before touching TrancheVault et al. (see Mou-Casper.md Section 6).
#[odra::module]
pub struct Hello {
    message: Var<String>,
}

#[odra::module]
impl Hello {
    pub fn init(&mut self) {
        self.message.set(String::from("AVAL is alive on Casper Testnet"));
    }

    pub fn set_message(&mut self, message: String) {
        self.message.set(message);
    }

    pub fn get_message(&self) -> String {
        self.message.get_or_default()
    }
}

#[cfg(test)]
mod tests {
    use crate::hello::Hello;
    use odra::host::{Deployer, NoArgs};

    #[test]
    fn says_hello() {
        let env = odra_test::env();
        let contract = Hello::deploy(&env, NoArgs);
        assert_eq!(contract.get_message(), "AVAL is alive on Casper Testnet");
    }
}
