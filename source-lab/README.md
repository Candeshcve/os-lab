# Source Lab

Source Lab is a proposed os-lab module that brings the implemented features and
UI pages of iQ-SourceContol into this repository. This directory currently holds
the migration design and work queue; it contains no runnable lab.

- [Plan](PLAN.md): integration design, sequence, migration and release criteria.
- [TODO](TODO.md): ordered tasks, dependencies and completion evidence.
- [Inventory](INVENTORY.md): pinned source snapshot, every page/API route and
  engine/data capabilities, with known gaps separated from shipped features.

Start with os-lab's [architecture graph](../lat.md/lat.md),
[contribution guide](../CONTRIBUTING.md) and
[UX readiness rules](../docs/UX_READINESS.md). The design keeps the existing
static dashboard and local Python console as the user-facing runtime.
