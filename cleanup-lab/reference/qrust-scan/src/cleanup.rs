use crate::tree::{NodeId, Tree};

/// Known regenerable directory basenames dua bulk-marks as cleanup
/// candidates. Must stay sorted for `binary_search`.
pub const CLEANUP_DIR_NAMES_SORTED: &[&str] = &[
    ".mypy_cache",
    ".pytest_cache",
    ".ruff_cache",
    ".tox",
    ".venv",
    "__pycache__",
    "node_modules",
    "target",
    "venv",
];

pub fn is_cleanup_candidate_name(name: &str) -> bool {
    CLEANUP_DIR_NAMES_SORTED.binary_search(&name).is_ok()
}

/// Visible siblings under `view_root` that are existing directories whose
/// basename matches the known-regenerable list — O(k log C) per view, same
/// as dua's `cleanup.rs` (name equality against the current view only, not
/// a full-tree walk).
pub fn cleanup_candidates(tree: &Tree, view_root: NodeId) -> Vec<NodeId> {
    tree.children(view_root)
        .into_iter()
        .filter(|&id| {
            let n = &tree.nodes[id as usize];
            n.is_dir && is_cleanup_candidate_name(&n.name)
        })
        .collect()
}
