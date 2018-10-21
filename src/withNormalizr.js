import plugin from './index';
import { normalize } from 'normalizr';
import { CALL_AJAX, CALL_RPC } from './symbols';

export {
  CALL_AJAX,
  CALL_RPC
};

export default function(option) {
  option.normalize = normalize;
  return plugin(option);
}
