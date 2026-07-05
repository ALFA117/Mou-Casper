use odra::prelude::*;

/// Every underwriting decision gets witnessed on-chain: rating, a hash of the
/// LLM's full reasoning (cheap to verify), the reasoning itself, which paid data
/// feeds were used, and who signed it. (Mou-Casper.md Section 4.1, contract #2.)
#[odra::module]
pub struct AttestationRegistry {
    next_id: Var<u64>,
    asset_id: Mapping<u64, String>,
    ratings: Mapping<u64, u32>,
    reasoning_hashes: Mapping<u64, String>,
    reasonings: Mapping<u64, String>,
    feeds_used: Mapping<u64, String>,
    signers: Mapping<u64, Address>,
    timestamps: Mapping<u64, u64>,
}

#[odra::module]
impl AttestationRegistry {
    pub fn init(&mut self) {
        self.next_id.set(0);
    }

    /// Underwriter agent attests to its rating for an asset batch. Returns the
    /// attestation id so the caller can link it from the dashboard / CSPR.live.
    pub fn attest(
        &mut self,
        asset_id: String,
        rating: u32,
        reasoning_hash: String,
        reasoning: String,
        feeds_used: String,
    ) -> u64 {
        let id = self.next_id.get_or_default();
        let caller = self.env().caller();
        let block_time = self.env().get_block_time();

        self.asset_id.set(&id, asset_id);
        self.ratings.set(&id, rating);
        self.reasoning_hashes.set(&id, reasoning_hash);
        self.reasonings.set(&id, reasoning);
        self.feeds_used.set(&id, feeds_used);
        self.signers.set(&id, caller);
        self.timestamps.set(&id, block_time);

        self.next_id.set(id + 1);
        id
    }

    pub fn asset_id_of(&self, id: u64) -> String {
        self.asset_id.get(&id).unwrap_or_default()
    }

    pub fn rating_of(&self, id: u64) -> u32 {
        self.ratings.get(&id).unwrap_or_default()
    }

    pub fn signer_of(&self, id: u64) -> Option<Address> {
        self.signers.get(&id)
    }

    pub fn reasoning_hash_of(&self, id: u64) -> String {
        self.reasoning_hashes.get(&id).unwrap_or_default()
    }

    pub fn reasoning_of(&self, id: u64) -> String {
        self.reasonings.get(&id).unwrap_or_default()
    }

    pub fn feeds_used_of(&self, id: u64) -> String {
        self.feeds_used.get(&id).unwrap_or_default()
    }

    pub fn timestamp_of(&self, id: u64) -> u64 {
        self.timestamps.get(&id).unwrap_or_default()
    }

    pub fn total_attestations(&self) -> u64 {
        self.next_id.get_or_default()
    }
}
