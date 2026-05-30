"use client";
// CLIENT STATE — owned by Preston (Lead). The single source of truth on the
// client: holds the DocumentModel and the tour position. Every component reads
// it through useDoc(). Keep this lean; visual logic lives in the components.
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from "react";
import type { ReactNode } from "react";
import type {
  DocumentModel,
  ExportFormat,
  Lang,
  Requirement,
  ReqStatus,
} from "@/lib/types";
import { exportDoc } from "@/lib/export";

interface State {
  doc: DocumentModel | null;
  lang: Lang;
  activeIndex: number;
}

type Action =
  | { t: "load"; doc: DocumentModel }
  | { t: "lang"; lang: Lang }
  | { t: "goTo"; index: number }
  | { t: "next" }
  | { t: "prev" }
  | { t: "setField"; fieldId: string; value: string | boolean | null }
  | { t: "setStatus"; reqId: string; status: ReqStatus }
  | { t: "reset" };

function sortedReqs(doc: DocumentModel | null): Requirement[] {
  if (!doc) return [];
  return [...doc.requirements].sort((a, b) => a.order - b.order);
}

function clamp(i: number, len: number): number {
  if (len <= 0) return 0;
  return Math.max(0, Math.min(i, len - 1));
}

function reducer(state: State, a: Action): State {
  switch (a.t) {
    case "load":
      return { ...state, doc: a.doc, activeIndex: 0 };
    case "lang":
      return { ...state, lang: a.lang };
    case "goTo":
      return { ...state, activeIndex: clamp(a.index, sortedReqs(state.doc).length) };
    case "next":
      return { ...state, activeIndex: clamp(state.activeIndex + 1, sortedReqs(state.doc).length) };
    case "prev":
      return { ...state, activeIndex: clamp(state.activeIndex - 1, sortedReqs(state.doc).length) };
    case "setField": {
      if (!state.doc) return state;
      const requirements = state.doc.requirements.map((r) => ({
        ...r,
        fields: r.fields.map((f) =>
          f.id === a.fieldId ? { ...f, value: a.value } : f,
        ),
      }));
      return { ...state, doc: { ...state.doc, requirements } };
    }
    case "setStatus": {
      if (!state.doc) return state;
      const requirements = state.doc.requirements.map((r) =>
        r.id === a.reqId ? { ...r, status: a.status } : r,
      );
      return { ...state, doc: { ...state.doc, requirements } };
    }
    case "reset":
      return { doc: null, lang: state.lang, activeIndex: 0 };
    default:
      return state;
  }
}

export interface DocStore extends State {
  reqs: Requirement[];
  active: Requirement | null;
  loadDoc: (doc: DocumentModel) => void;
  setLang: (l: Lang) => void;
  goTo: (i: number) => void;
  next: () => void;
  prev: () => void;
  setFieldValue: (fieldId: string, value: string | boolean | null) => void;
  setStatus: (reqId: string, status: ReqStatus) => void;
  exportAs: (format: ExportFormat) => void;
  reset: () => void;
}

const Ctx = createContext<DocStore | null>(null);

export function DocProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    doc: null,
    lang: "en",
    activeIndex: 0,
  });

  const reqs = useMemo(() => sortedReqs(state.doc), [state.doc]);
  const active = reqs[state.activeIndex] ?? null;

  const loadDoc = useCallback((doc: DocumentModel) => dispatch({ t: "load", doc }), []);
  const setLang = useCallback((lang: Lang) => dispatch({ t: "lang", lang }), []);
  const goTo = useCallback((index: number) => dispatch({ t: "goTo", index }), []);
  const next = useCallback(() => dispatch({ t: "next" }), []);
  const prev = useCallback(() => dispatch({ t: "prev" }), []);
  const setFieldValue = useCallback(
    (fieldId: string, value: string | boolean | null) =>
      dispatch({ t: "setField", fieldId, value }),
    [],
  );
  const setStatus = useCallback(
    (reqId: string, status: ReqStatus) => dispatch({ t: "setStatus", reqId, status }),
    [],
  );
  const reset = useCallback(() => dispatch({ t: "reset" }), []);
  const exportAs = useCallback(
    (format: ExportFormat) => {
      if (state.doc) exportDoc(state.doc, format, state.lang);
    },
    [state.doc, state.lang],
  );

  const value = useMemo<DocStore>(
    () => ({
      ...state,
      reqs,
      active,
      loadDoc,
      setLang,
      goTo,
      next,
      prev,
      setFieldValue,
      setStatus,
      exportAs,
      reset,
    }),
    [state, reqs, active, loadDoc, setLang, goTo, next, prev, setFieldValue, setStatus, exportAs, reset],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDoc(): DocStore {
  const c = useContext(Ctx);
  if (!c) throw new Error("useDoc must be used inside <DocProvider>");
  return c;
}
