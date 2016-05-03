'use strict';

angular.module('bridgeApp')
  .service('AbstractMutationOperator', function (BridgeNode, BridgeEdge, SettingsManager) {

    class AbstractMutationOperator {
      constructor(referenceDriver) {
        this.rd = referenceDriver;
        this.bridgeMaterial = referenceDriver.bridgeMaterial;
        this.weight = SettingsManager.all.ga.operators[this.constructor.displayName];
        this.tries = 10;
      }

      mutate(builder) {
        //attempt mutating tries times
        for (var attempt = 0; attempt < this.tries; attempt++) {
          if (this._mutate(builder)) {
            //return 1 if successful
            return 1;
          }
        }

        //0 otherwise
        return 0;
      }

      _mutate(/*builder*/) {
        console.error('abstract');
      }

      randBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
      }

      verifyNode(builder, nodePos) {
        let [sx, sy] = this.rd.platforms.getStart();
        let absX = nodePos[0] + sx;
        let absY = nodePos[1] + sy;

        //invalid if it is out of bounds
        if (absX <= 0 || absY <= 0 || this.rd.stageWidth <= absX || this.rd.stageHeight < absY) return false;

        let [ex, ey] = this.rd.platforms.getEnd();

        //invalid if it is inside platforms
        if (absX < sx && absY > sy) return false;
        if (absX > ex && absY > ey) return false;

        let node = new BridgeNode(absX - sx, absY - sy);

        //invalid if it already exists
        if (builder.nodes.findIndex(n => n.equals(node)) >= 0) return false;

        return node;
      }

      connectRandomly(builder, node, material) {
        //find nodes that are in range
        let inRange = this.findInRange(builder, node, material);

        if (inRange.length <= 0) return false;

        //pick one
        let second = this.randBetween(0, inRange.length - 1);
        second = builder.nodes.indexOf(inRange[second]);

        let floor = this.randBetween(0, 100) < 1;

        //try to connect them
        if (this.connectNodesIfNotIntersecting(builder, node, builder.nodes[second], material, floor)) {
          //success
          builder.nodes.push(node);
          return true;
        } else {
          //invalid if there is an intersection
          return false;
        }

      }

      findInRange(builder, node, material) {
        return builder.nodes.filter(n => {
          //distance smaller than max
          var edgeLength = this.distanceBetween(node.relative, n.relative);
          return edgeLength < material.userData.maxLength && edgeLength > 0;
        });
      }

      distanceBetween(first, second) {
        return this.rd.mathDevice.v2Length(this.rd.mathDevice.v2Sub(first, second));
      }

      edgeIntersecting(builder, first, second, ignoreSame) {
        ignoreSame = !!ignoreSame;
        //check intersection with other edges
        if (builder.connections.some(c => {
            if (ignoreSame && first.equals(builder.nodes[c.a]) && second.equals(builder.nodes[c.b])) return false;
            return this.intersects(first.relative, second.relative, builder.nodes[c.a].relative, builder.nodes[c.b].relative);
          })) return true;

        //check intersections with platforms
        return !!this.rd.platforms.segments.some(s => {
          return this.intersects(first.relative, second.relative, s[0], s[1], true);
        });
      }

      connectNodesIfNotIntersecting(builder, first, second, m, f) {
        if (this.edgeIntersecting(builder, first, second)) return false;

        //connect the nodes
        let fi = builder.nodes.findIndex(n => n.equals(first));
        fi = fi < 0 ? builder.nodes.length : fi;
        let si = builder.nodes.findIndex(n => n.equals(second));

        return builder.connections.push({a: fi, b: si, e: new BridgeEdge(m, f)});
      }

      intersects(v1, v2, v3, v4, touchingAllowed) {
        let p = v1;
        let q = v3;
        let r = this.rd.mathDevice.v2Sub(v2, v1);
        let s = this.rd.mathDevice.v2Sub(v4, v3);

        let pd = this.rd.mathDevice.v2PerpDot(r, s);
        let t = this.rd.mathDevice.v2PerpDot(this.rd.mathDevice.v2Sub(q, p), s) / pd;
        let u = this.rd.mathDevice.v2PerpDot(this.rd.mathDevice.v2Sub(q, p), r) / pd;


        if (t < 0 || t > 1.0 || u < 0 || u > 1.0) {
          //not even close
          return false;
        } else if (touchingAllowed && (t <= 0 || t >= 1.0 || u <= 0 || u >= 1.0)) {
          //touching with only one end might be allowed
          return false;
        } else if ((t <= 0 || t >= 1.0) && (u <= 0 || u >= 1.0)) {
          //collinear always allowed
          return false;
        } else {
          //intersecting at this point
          return this.rd.mathDevice.v2Add(p, this.rd.mathDevice.v2ScalarMul(r, t));
        }

      }

      chooseMaterial() {
        //lol only one material
        switch (0/*this.randBetween(0,4?)*/) {
          case 0:
            return this.bridgeMaterial;
        }
      }

      traversableNodes(builder) {
        //go through all nodes reachable from the left side
        let b = angular.copy(builder);

        for (let conn of b.connections) {
          b.nodes[conn.a].connect(b.nodes[conn.b], conn.e);
        }

        let seenNodes = new Set();
        let pq = [];
        pq.push(...b.nodes[0].children);
        seenNodes.add(b.nodes[0]);

        while (pq.length > 0) {
          let e = pq.shift();
          if (!seenNodes.has(e.a)) {
            seenNodes.add(e.a);
            pq.push(...e.a.children);
          }
          if (!seenNodes.has(e.b)) {
            seenNodes.add(e.b);
            pq.push(...e.b.children);
          }
        }

        //if less than all nodes are reachable then disjoint
        return Array.from(seenNodes).length === builder.nodes.length;
      }

      builderWithoutNode(builder, index) {
        //strips a node with index from the builder
        let fresh = {
          nodes: angular.copy(builder.nodes),
          connections: []
        };

        fresh.nodes.splice(index, 1);

        for (let conn of angular.copy(builder.connections)) {
          if (conn.a === index || conn.b === index) continue;

          if (conn.a > index) conn.a--;
          if (conn.b > index) conn.b--;
          fresh.connections.push(conn);
        }

        return fresh;
      }

      countNodeConnections(builder) {
        //counts connections to a node
        let connCnt = [];
        for (var i = 0; i < builder.nodes.length; i++) {
          connCnt[i] = {i, ns: []};
        }

        for (let conn of builder.connections) {
          connCnt[conn.a].ns.push(conn.b);
          connCnt[conn.b].ns.push(conn.a);
        }

        return connCnt;
      }

    }

    return AbstractMutationOperator;
  });
