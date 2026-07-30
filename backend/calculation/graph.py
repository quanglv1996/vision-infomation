"""NetworkX-based dependency graph over the formula library."""
from __future__ import annotations

from typing import Optional

import networkx as nx

from knowledge.formulas import FORMULAS, Formula
from knowledge.parameters import PARAMETERS


def build_parameter_graph() -> nx.DiGraph:
    """
    Build a directed graph where:
      - Nodes are parameter IDs (with metadata).
      - An edge A → B labelled with formula_id means
        'formula uses A as input to produce B'.
    """
    G = nx.DiGraph()

    for pid, param in PARAMETERS.items():
        G.add_node(pid, name=param.name, unit=param.unit, category=param.category.value)

    for formula in FORMULAS:
        for inp in formula.inputs:
            G.add_edge(inp, formula.output, formula_id=formula.id, formula_name=formula.name)

    return G


def get_ancestors(G: nx.DiGraph, param_id: str) -> set[str]:
    """All parameters that *param_id* depends on (directly or transitively)."""
    return nx.ancestors(G, param_id)


def get_descendants(G: nx.DiGraph, param_id: str) -> set[str]:
    """All parameters that can be derived once *param_id* is known."""
    return nx.descendants(G, param_id)


def topological_order(G: nx.DiGraph) -> list[str]:
    """Return parameter IDs in a valid calculation order (leaves first)."""
    try:
        return list(nx.topological_sort(G))
    except nx.NetworkXUnfeasible:
        return list(G.nodes)


def shortest_path(G: nx.DiGraph, source: str, target: str) -> Optional[list[str]]:
    try:
        return nx.shortest_path(G, source, target)
    except (nx.NetworkXNoPath, nx.NodeNotFound):
        return None


def graph_to_json(G: nx.DiGraph, known: set[str], calculated: set[str], targets: set[str]) -> dict:
    """Serialise the graph for the React Flow visualisation."""
    nodes = []
    edges = []

    for node_id, data in G.nodes(data=True):
        if node_id in known:
            status = "input"
        elif node_id in targets:
            status = "target"
        elif node_id in calculated:
            status = "calculated"
        else:
            status = "unknown"

        nodes.append({
            "id": node_id,
            "data": {
                "label": data.get("name", node_id),
                "unit": data.get("unit", ""),
                "category": data.get("category", ""),
                "status": status,
            },
        })

    seen_edges: set[tuple[str, str]] = set()
    for u, v, edata in G.edges(data=True):
        key = (u, v)
        if key in seen_edges:
            continue
        seen_edges.add(key)
        edges.append({
            "id": f"{u}__{v}",
            "source": u,
            "target": v,
            "label": edata.get("formula_name", ""),
            "data": {"formula_id": edata.get("formula_id", "")},
        })

    return {"nodes": nodes, "edges": edges}


# Pre-built singleton graph
PARAM_GRAPH: nx.DiGraph = build_parameter_graph()
