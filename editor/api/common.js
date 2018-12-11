import { gt, lt, eq } from 'semver'
export function subset(subRange, superRange, loose) {
  const OPEN = 0
  const CLOSE = 1
  // +∞ ASCII 047
  const POS_INF = ':'
  // −∞ ASCII 058
  const NEG_INF = '/'

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
      } else if (leftValue.operator === undefined) {
        // any
        left = OPEN
        right = OPEN
        leftValue = NEG_INF
        rightValue = POS_INF
      } else if (leftValue.operator.indexOf('>') !== -1) {
        rightValue = POS_INF
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
        leftValue = NEG_INF
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
    if (v1.semver) {
      if (v2.semver) {
        return eq(v1.semver.version, v2.semver.version)
      } else {
        return false
      }
    } else {
      if (v2.semver) {
        return false
      } else {
        return v1 === v2
      }
    }
  }

  function orderGt(v1, v2) {
    if (v1.semver) {
      if (v2.semver) {
        return gt(v1.semver.version, v2.semver.version)
      } else {
        return v1.semver.version > v2
      }
    } else {
      if (v2.semver) {
        return v1 > v2.semver.version
      } else {
        return v1 > v2
      }
    }
  }

  function orderLt(v1, v2) {
    return !orderEq(v1, v2) && !orderGt(v1, v2)
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
  for (let i = 0; i < subRange.set.length; i++) {
    const subInterval = genInterval(subRange.set[i])
    let exist = false
    for (let j = 0; j < superRange.set.length; j++) {
      const superInterval = genInterval(superRange.set[j])
      if (isSubset(subInterval, superInterval)) {
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

