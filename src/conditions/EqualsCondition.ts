import { CommonUtil } from './../utils/common';
import { IConditionFunction } from './IConditionFunction';
import { AccessControlError } from '../core';
import { ConditionUtil } from './util';

/**
 * Equals condition
 *
 *  @author Dilip Kola <dilip@tensult.com>
 */

export class EqualsCondition implements IConditionFunction {
    defaultOptions = { allowUndefined: false };

    evaluate(args?: any, context?: any, options?: EqualsCondition['defaultOptions']) {
        if (!args) {
            return true;
        }

        if (!context) {
            return false;
        }

        const opts = { ...this.defaultOptions, ...(options || {}) };

        if (CommonUtil.type(args) !== 'object') {
            throw new AccessControlError('EqualsCondition expects type of args to be object')
        }

        return Object.keys(args).every((key) => {
            return CommonUtil.matchesAnyElement(args[key], (elm) => {
                const keyValue = key.startsWith('$.') ?  ConditionUtil.getValueByPath(context, key) : context[key];
                if (keyValue === undefined && !opts.allowUndefined) {
                    // throw new AccessControlError(`Value for key "${key}" evaluated to undefined and allowUndefined is set to false`);
                    return false;
                }

                const comparator = ConditionUtil.getValueByPath(context, elm);
                if (comparator === undefined && !opts.allowUndefined) {
                    // throw new AccessControlError(`Value for key "${elm}" evaluated to undefined and allowUndefined is set to false`);
                    return false;
                }

                return comparator === keyValue;
            });
        });
    }
}
