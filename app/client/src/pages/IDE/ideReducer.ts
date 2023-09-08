import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { Item } from "./components/ListView";

export interface IDEReduxState {
  sidebarWidth: number;
  pageNavState: PageNavState;
  queryList: Item[];
  jsList: Item[];
}

export enum IDEAppState {
  Data = "data",
  Page = "page",
  Add = "add",
  Libraries = "libs",
  Settings = "settings",
}

export enum PageNavState {
  UI = "ui",
  JS = "js",
  QUERIES = "queries",
}

const initialState: IDEReduxState = {
  sidebarWidth: 300,
  pageNavState: PageNavState.UI,
  queryList: [],
  jsList: [],
};

const ideReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_IDE_SIDEBAR_WIDTH]: (
    state: IDEReduxState,
    action: ReduxAction<number>,
  ): IDEReduxState => {
    return { ...state, sidebarWidth: action.payload };
  },
  [ReduxActionTypes.SET_IDE_PAGE_NAV]: (
    state: IDEReduxState,
    action: ReduxAction<PageNavState>,
  ): IDEReduxState => {
    return { ...state, pageNavState: action.payload };
  },
  [ReduxActionTypes.SET_RECENT_QUERY_LIST]: (
    state: IDEReduxState,
    action: ReduxAction<Item[]>,
  ): IDEReduxState => {
    return { ...state, queryList: action.payload };
  },
  [ReduxActionTypes.SET_RECENT_JS_LIST]: (
    state: IDEReduxState,
    action: ReduxAction<Item[]>,
  ): IDEReduxState => {
    return { ...state, jsList: action.payload };
  },
});

export default ideReducer;
