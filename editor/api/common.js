import { gt, lt } from 'semver'
export function subset(r1, r2, loose) {
  const OPEN = 0
  const CLOSE = 1
  const INF = 'infinite'

  // from comparators to interval
  function genInterval(comparators) {
    // [v, v]
    let left = CLOSE
    let right = CLOSE
    let leftValue = comparators[0]
    let rightValue = comparators[1]

    if (rightValue) {
      // there's not infinite endpoints
      if (rightValue.operator.indexOf('=') === -1) {
        // [v, v)
        right = OPEN
      }
    } else {
      if (leftValue.operator === '') {
        // just a point
        rightValue = leftValue
      } else if (leftValue.operator.indexOf('>') !== -1) {
        rightValue = INF
        right = OPEN
        if (leftValue.operator.indexOf('=') !== -1) {
          // [v, +∞)
          left = CLOSE
        } else {
          // (v, +∞)
          left = OPEN
        }
      } else {
        rightValue = leftValue
        leftValue = INF
        left = OPEN
        if (rightValue.operator.indexOf('=') !== -1) {
          // (−∞, v]
          right = CLOSE
        } else {
          // (−∞, v)
          right = OPEN
        }
      }
    }
    return {
      left: left,
      leftValue: leftValue,
      rightValue: rightValue,
      right: right,
    }
  }

  function orderEq(v1, v2) {
    return (
      (v1 === INF && v2 === INF) ||
      (v1 !== INF && v2 !== INF && v1.semver.version === v2.semver.version)
    )
  }

  function orderGt(v1, v2) {
    return (
      (v1 === INF && v2 !== INF) ||
      (v1 !== INF && v2 !== INF && gt(v1.semver.version, v2.semver.version))
    )
  }

  function orderLt(v1, v2) {
    return (
      (v1 !== INF && v2 === INF) ||
      (v1 !== INF && v2 !== INF && lt(v1.semver.version, v2.semver.version))
    )
  }

  function isSubset(interval1, interval2) {
    if (orderEq(interval1.leftValue, interval2.leftValue)) {
      if (interval1.left > interval2.left) {
        // [v > (v
        return false
      } else {
        // [v = [v
        // (v < [v
        if (orderEq(interval1.rightValue, interval2.rightValue)) {
          if (interval1.right > interval2.right) {
            // v] > v)
            return false
          } else {
            // v] = v]
            // v) < v]
            return true
          }
        } else if (orderGt(interval1.rightValue, interval2.rightValue)) {
          return false
        } else {
          return true
        }
      }
    } else if (orderLt(interval1.leftValue, interval2.leftValue)) {
      return false
    } else if (orderGt(interval1.rightValue, interval2.rightValue)) {
      return false
    } else if (orderEq(interval1.rightValue, interval2.rightValue)) {
      // v] = v]
      // v) < v]
      return true
    } else {
      return true
    }
  }

  // (−∞, +∞) denotes the set of all ordinary real numbers, not the extended reals
  for (let i = 0; i < r1.set.length; i++) {
    const r1Interval = genInterval(r1.set[i])
    let exist = false
    for (let j = 0; j < r2.set.length; j++) {
      const r2Interval = genInterval(r2.set[j])
      if (isSubset(r1Interval, r2Interval)) {
        exist = true
        break
      }
    }
    if (!exist) {
      return false
    }
  }
  return true
}
