/**
 *
 * ©2018-2019 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
 * Bangalore, India. All Rights Reserved.
 *
 */

/**
 * This mixin is to support eventual consistency. This mixin support patterns of
 * Idempotent behavior or replay behavior, which will enable framework to perform actions
 * multiple times and preserve the same outcome. The system maintains this
 * behavior in CRUD operations.
 *
 * Idempotent behavior – The ability to perform the same operation multiple time
 * and always receive the same results
 *
 * @mixin Idempotent mixin
 * @author Praveen
 */

module.exports = function IdempotencyMixin(Model) {

};


