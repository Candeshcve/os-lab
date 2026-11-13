use globset::GlobBuilder;

use crate::tree::{NodeId, Tree};

#[derive(Debug)]
pub struct GlobMatch {
    pub node: NodeId,
    pub relative_path: String,
}

/// In-memory DFS glob seek over an already-scanned tree — dua's `/` search
///. Scoped to the subtree under `view_root`, not a
/// filesystem re-walk. `*`/`?` never cross `/` (dua's `NO_MATCH_SLASH_LITERAL`);
/// `**` still crosses directory boundaries. On a match the node is recorded
/// and its children are *not* searched further — the match is the seek result.
pub fn glob_search(
    tree: &Tree,
    view_root: NodeId,
    pattern: &str,
    case_insensitive: bool,
) -> Result<Vec<GlobMatch>, String> {
    let trimmed = pattern.trim();
    if trimmed.is_empty() {
        return Err("Glob was empty or only whitespace".to_string());
    }
    let glob = GlobBuilder::new(trimmed)
        .case_insensitive(case_insensitive)
        .literal_separator(true)
        .build()
        .map_err(|e| e.to_string())?
        .compile_matcher();

    let mut results = Vec::new();
    let mut path = String::new();
    walk(tree, view_root, &glob, &mut path, &mut results);
    Ok(results)
}

fn walk(
    tree: &Tree,
    node: NodeId,
    glob: &globset::GlobMatcher,
    path: &mut String,
    results: &mut Vec<GlobMatch>,
) {
    for child in tree.children(node) {
        let n = &tree.nodes[child as usize];
        let start = path.len();
        if !path.is_empty() {
            path.push('/');
        }
        path.push_str(&n.name);

        if glob.is_match(path.as_str()) {
            results.push(GlobMatch {
                node: child,
                relative_path: path.clone(),
            });
        } else if n.is_dir {
            walk(tree, child, glob, path, results);
        }
        path.truncate(start);
    }
}
