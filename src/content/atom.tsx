import { atom } from "jotai";

import { VIEWS, TABS } from "../utils/constants";

export const drawerOpenAtom = atom(false);
export const viewAtom = atom<VIEWS>(VIEWS.main);
export const tabAtom = atom<TABS>(TABS.run);

export const messageAtom = atom("");
export const aiIdxAtom = atom("");
