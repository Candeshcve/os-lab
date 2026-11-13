use std::path::{Path, PathBuf};

use ignore::gitignore::GitignoreBuilder;

use crate::tree::{NodeId, Tree};

/// Walk upward from `start` looking for a `.git` entry — dua's repo
/// discovery step before loading the exclude stack.
pub fn discover_repo_root(start: &Path) -> Option<PathBuf> {
    let mut cur = Some(start);
    while let Some(dir) = cur {
        if dir.join(".git").exists() {
            return Some(dir.to_path_buf());
        }
        cur = dir.parent();
    }
    None
}

/// Visible children under `view_root` that are gitignored, per the nearest
/// enclosing repo's `.gitignore` stack. `view_root_abs_path` is the real
/// filesystem path corresponding to `view_root` (the tree only stores
/// names, so the caller supplies the absolute path once per call).
///
/// Scoped to the current view's entries only, same as dua's
/// `interactive/app/gitignore.rs` — not a recursive re-walk of the tree.
pub fn gitignored_children(
    tree: &Tree,
    view_root: NodeId,
    view_root_abs_path: &Path,
) -> Vec<NodeId> {
    let Some(repo_root) = discover_repo_root(view_root_abs_path) else {
        return Vec::new();
    };
    let mut builder = GitignoreBuilder::new(&repo_root);
    let _ = builder.add(repo_root.join(".gitignore"));
    let Ok(matcher) = builder.build() else {
        return Vec::new();
    };

    tree.children(view_root)
        .into_iter()
        .filter(|&id| {
            let n = &tree.nodes[id as usize];
            let full = view_root_abs_path.join(n.name.as_ref());
            matcher.matched(&full, n.is_dir).is_ignore()
        })
        .collect()
}
