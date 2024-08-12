export { default as Slice } from './src/classes/Slice/Slice';
export { default as Store } from './src/classes/Store/Store';
export { default as useStoreSelector } from './src/hooks/useStoreSelector/useStoreSelector';
export { default as useStoreState } from './src/hooks/useStoreState/useStoreState';
// actions
export { default as adder } from './src/actions/adder/adder';
export { default as appender } from './src/actions/appender/appender';
export {
  composeActions,
  pipeActions,
} from './src/actions/composeActions/composeActions';
export { default as cycler } from './src/actions/cycler/cycler';
export { fetcher } from './src/actions/fetcher/fetcher';
export { default as mapper } from './src/actions/mapper/mapper';
export { default as merger } from './src/actions/merger/merger';
export { default as remover } from './src/actions/remover/remover';
export { default as replacer } from './src/actions/replacer/replacer';
export { setter, setterInput } from './src/actions/setter/setter';
export { default as toggler } from './src/actions/toggler/toggler';
// libs
export { default as replacePath } from './src/lib/replacePath/replacePath';
export { default as selectPath } from './src/lib/selectPath/selectPath';
export { default as shallowCopy } from './src/lib/shallowCopy/shallowCopy';
export { default as shallowOverride } from './src/lib/shallowOverride/shallowOverride';
export { default as updatePath } from './src/lib/updatePath/updatePath';
// plugins
export { default as consoleLogger } from './src/plugins/consoleLogger/consoleLogger';
export { default as observable } from './src/plugins/observable/observable';
export { default as persistState } from './src/plugins/persistState/persistState';
export { default as syncUrl } from './src/plugins/syncUrl/syncUrl';
export { default as undo } from './src/plugins/undo/undo';
