/**
 * cocoro — CognitiveTrustGraph
 * 参加者間の関係を**グラフ構造**で管理
 *
 * 2026年メタバースレポート:
 * - 信頼の推移律(transitive trust)
 * - サブグループ(クリーク)自動検出
 * - ソーシャルグラフ分析
 *
 * 運用コスト: ¥0 (純粋な計算)
 */

export interface TrustEdge {
  from: string;
  to: string;
  weight: number;          // 0-1 (trust level)
  interactionCount: number;
  lastInteraction: number;
  kind: 'conversation' | 'reaction' | 'game' | 'gift' | 'collab';
}

export interface CommunityClique {
  id: string;
  members: string[];
  cohesion: number;    // 0-1 (avg internal trust)
  label: string;
}

export class CognitiveTrustGraph {
  private edges: Map<string, TrustEdge[]> = new Map(); // fromId → edges
  private nodeSet: Set<string> = new Set();

  /** ノード追加 */
  addNode(participantId: string): void {
    this.nodeSet.add(participantId);
  }

  /** エッジ更新(信頼/交流の記録) */
  recordInteraction(from: string, to: string, kind: TrustEdge['kind'], strength: number = 0.1): void {
    this.addNode(from);
    this.addNode(to);

    const edges = this.edges.get(from) ?? [];
    let edge = edges.find(e => e.to === to);

    if (!edge) {
      edge = { from, to, weight: 0.1, interactionCount: 0, lastInteraction: 0, kind };
      edges.push(edge);
      this.edges.set(from, edges);
    }

    edge.interactionCount++;
    edge.lastInteraction = Date.now();
    edge.weight = Math.min(1, edge.weight + strength * 0.1);
    edge.kind = kind;

    // Bidirectional (weaker)
    const reverseEdges = this.edges.get(to) ?? [];
    let reverseEdge = reverseEdges.find(e => e.to === from);
    if (!reverseEdge) {
      reverseEdge = { from: to, to: from, weight: 0.05, interactionCount: 0, lastInteraction: 0, kind };
      reverseEdges.push(reverseEdge);
      this.edges.set(to, reverseEdges);
    }
    reverseEdge.interactionCount++;
    reverseEdge.lastInteraction = Date.now();
    reverseEdge.weight = Math.min(1, reverseEdge.weight + strength * 0.05);
  }

  /** 推移的信頼 (A trusts B, B trusts C → A somewhat trusts C) */
  getTransitiveTrust(from: string, to: string): number {
    // Direct trust
    const direct = this.getDirectTrust(from, to);
    if (direct > 0) return direct;

    // One-hop transitive
    const fromEdges = this.edges.get(from) ?? [];
    let maxTransitive = 0;
    for (const e of fromEdges) {
      const intermediary = e.to;
      const secondHop = this.getDirectTrust(intermediary, to);
      if (secondHop > 0) {
        const transitive = e.weight * secondHop * 0.5; // Decay factor
        maxTransitive = Math.max(maxTransitive, transitive);
      }
    }
    return maxTransitive;
  }

  /** 直接信頼 */
  getDirectTrust(from: string, to: string): number {
    const edges = this.edges.get(from) ?? [];
    const edge = edges.find(e => e.to === to);
    return edge?.weight ?? 0;
  }

  /** コミュニティのクリーク(サブグループ)検出 */
  detectCliques(minSize = 3): CommunityClique[] {
    const cliques: CommunityClique[] = [];
    const nodes = Array.from(this.nodeSet);

    // Simplified clique detection: find groups with mutual high trust
    const visited = new Set<string>();

    nodes.forEach(startNode => {
      if (visited.has(startNode)) return;

      const group: string[] = [startNode];
      const startEdges = this.edges.get(startNode) ?? [];

      // Find strongly connected neighbors
      startEdges
        .filter(e => e.weight >= 0.3)
        .sort((a, b) => b.weight - a.weight)
        .forEach(e => {
          if (!visited.has(e.to) && group.length < 8) {
            // Check mutual connections
            const mutual = group.every(member => this.getDirectTrust(e.to, member) > 0.1);
            if (mutual) group.push(e.to);
          }
        });

      if (group.length >= minSize) {
        group.forEach(n => visited.add(n));
        const cohesion = this.calculateCohesion(group);
        cliques.push({
          id: `clique_${cliques.length}`,
          members: group,
          cohesion,
          label: `グループ${cliques.length + 1} (${group.length}人)`,
        });
      }
    });

    return cliques;
  }

  /** ネットワーク密度 */
  getNetworkDensity(): number {
    const n = this.nodeSet.size;
    if (n < 2) return 0;
    let totalEdges = 0;
    this.edges.forEach(list => { totalEdges += list.length; });
    return totalEdges / (n * (n - 1));
  }

  /** 最も影響力のあるノード */
  getMostInfluential(topN = 5): { participantId: string; influence: number }[] {
    const influence = new Map<string, number>();
    this.nodeSet.forEach(node => {
      const outEdges = this.edges.get(node) ?? [];
      const totalWeight = outEdges.reduce((s, e) => s + e.weight, 0);
      influence.set(node, totalWeight);
    });
    return Array.from(influence.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, topN)
      .map(([participantId, inf]) => ({ participantId, influence: inf }));
  }

  /** 信頼の減衰(時間経過) */
  decayTrust(decayRate = 0.001): void {
    this.edges.forEach(list => {
      list.forEach(e => {
        const daysSince = (Date.now() - e.lastInteraction) / 86400000;
        e.weight = Math.max(0, e.weight - decayRate * daysSince);
      });
    });
  }

  private calculateCohesion(group: string[]): number {
    let totalTrust = 0;
    let pairs = 0;
    for (let i = 0; i < group.length; i++) {
      for (let j = 0; j < group.length; j++) {
        if (i !== j) {
          totalTrust += this.getDirectTrust(group[i], group[j]);
          pairs++;
        }
      }
    }
    return pairs > 0 ? totalTrust / pairs : 0;
  }

  getNodeCount(): number { return this.nodeSet.size; }
}
