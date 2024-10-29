export {};
declare global {
  var diffDOM: {
    DiffDOM: any,
    nodeToObj: (val: any) => any
  }
  var html_beautify: (code: string, options: any) => any;
  var js_beautify: (code: string, options: any) => any;
  var hljs: {
    highlight: (code: string, options: any) => any;
  }
}

// Gilda types

type GildaElement = {
  type: Component<any> | string;
  props: { [key: string]: any };
};

type GildaNode = undefined | null | "" | 0 | string | boolean | GildaElement;

type Component<T> = (props: T) => GildaNode;

type Setter<T> = (newValue: T) => void;
type StateHook<T> = { value: T; setter: Setter<T> };

// Gilda API

function el<T>(
  type: string | Component<T>,
  props?: T | null,
  ...children: GildaNode[]
): GildaElement {
  return { type, props: { ...props, children } };
}

function fragment(...children: GildaNode[]): GildaNode {
  return el<any>("", null, ...children);
}

function render(root: GildaNode, parentNode?: Node): Node {
  if (
    root == null ||
    root == 0 ||
    root == "" ||
    root === true ||
    root === false
  ) {
    return document.createTextNode("");
  }
  if (typeof root === "string") {
    return document.createTextNode(root);
  }
  const { type, props } = root;
  if (type == null) {
    throw new Error(`invalid Element type: ${root}`);
  }
  if (typeof type === "string") {
    if (type === "") {
      if (parentNode == null) {
        throw new Error("fragment missing parent node");
      }
      // render children of this fragment into the parent node
      props.children.forEach((child: GildaNode) => {
        const node = render(child, parentNode);
        if (node != parentNode) {
          parentNode.appendChild(node);
        }
      });
      return parentNode;
    }

    const node = document.createElement(type);
    for (const [name, value] of Object.entries(props)) {
      if (name === "children") {
        continue;
      }
      if (
        ["input", "textarea", "button"].includes(type) &&
        name.match(/on.*/i) &&
        typeof value === "function"
      ) {
        // this prop is an event handler, need to call browser API
        const eventType = name.match(/on(.*)/)?.[1]?.toLowerCase();
        if (eventType == null) {
          throw new Error(`invalid event type: ${eventType}`);
        }
        node.addEventListener(eventType, value);
      } else {
        node.setAttribute(name, value);
      }
    }
    (props.children || []).forEach((child: GildaNode) => {
      const renderedNode = render(child, parentNode);
      if (renderedNode != node) {
        node.appendChild(renderedNode);
      }
    });
    return node;
  } else if (typeof type === "function") {
    const element = type(props);
    return render(element, parentNode);
  } else {
    throw new Error(`invalid Element type: ${typeof root.type}`);
  }
}

function useState<T>(initialValue: T): [T, Setter<T>] {
  let hook = currentHooks[hookCounter];

  if (!hook) {
    hook = {
      value: initialValue
    } as StateHook<T>;

    hook.setter = (newValue) => {
      hook.value = newValue;
      triggerUpdate();
    };

    currentHooks[hookCounter] = hook;
  }

  hookCounter++;
  return [hook.value, hook.setter];
}

// Helper functions

function triggerUpdate() {
  const event = new Event("update");
  dispatchEvent(event);
}

function getComponentFromWindow(
  name?: string | null
): Component<any> | undefined {
  if (name == null || name == "") {
    return;
  }
  return (window as Record<string, any>)[name] as Component<any>;
}

function attrsToProps(el: Element) {
  const props: { [key: string]: any } = {};
  for (let i = 0; i < el.attributes.length; i++) {
    const attr = el.attributes[i];
    props[attr.name] = attr.value;
  }
  return props;
}

// Gilda runtime

let currentHooks: StateHook<any>[] = [];
let hookCounter = 0;

class GildaCustomElement extends HTMLElement {
  static observedAttributes = ["type"];

  private hooks: StateHook<any>[] = [];
  private component?: Component<any>;
  private componentType?: string;
  private shadow?: ShadowRoot;

  connectedCallback() {
    this.hooks = [];

    this.shadow = this.attachShadow({ mode: "open" });

    const container = document.createElement("div");
    this.shadow.appendChild(container);

    const componentType = this.shadow.host.getAttribute("type") || "";
    this.componentType = componentType;

    const component = getComponentFromWindow(componentType);
    if (typeof component !== "function") {
      throw new Error(`undefined Component: ${componentType}`);
    }
    this.component = component;

    this.handleUpdate();

    // further updates are caused by the 'update' event
    addEventListener("update", this.handleUpdate.bind(this));
  }

  handleUpdate() {
    if (this.shadow == null || this.component == null || this.componentType == null) {
      console.warn("component not mounted, cannot update");
      return;
    }

    // TODO only render the component that changed & its children

    currentHooks = this.hooks;
    hookCounter = 0;

    const domProps = attrsToProps(this.shadow.host);
    const element = this.component(domProps);

    // temporary <div> to hold nodes in fragment
    const temp = document.createElement("div");
    const newRoot = render(element, temp);
    // replace <div> with its child nodes, eliminating the fragment
    
    temp.replaceWith(...Array.from(temp.childNodes));

    updateRenderedOutput(this.componentType, (newRoot as Element).outerHTML);

    // TODO preserve event handlers
    const dd = new diffDOM.DiffDOM({
      preDiffApply: function (info: { node?: Node, newNode?: Node }) {
        const node = info.node;
        const newNode = info.newNode;
        if (newNode != null && newNode.nodeName.toLowerCase() === "input") {
          console.log("preDiffApply1", info);
        }
        if (node != null && node.nodeName.toLowerCase() === "input") {
          console.log("preDiffApply2", info);
        }
      },
      postDiffApply: function (info: { node?: Node, newNode?: Node }) {
        const node = info.node;
        const newNode = info.newNode;
        if (newNode != null && newNode.nodeName.toLowerCase() === "input") {
          console.log("postDiffApply1", info);
        }
        if (node != null && node.nodeName.toLowerCase() === "input") {
          console.log("postDiffApply2", info);
        }
      }
    });

    const currentRoot = this.shadow.childNodes[0];

    try {
      const diff = dd.diff(
        diffDOM.nodeToObj(currentRoot),
        diffDOM.nodeToObj(newRoot)
      );

      console.log("diff", diff);

      if (!dd.apply(currentRoot, diff)) {
        throw new Error();
      }
    } catch (error) {
      console.error("failed to diff", error);

      // fallback to replacing the entire old root
      this.shadow.replaceChildren(newRoot);
    }

    // TODO fix event handlers getting messed up by the diff
    // TODO make sure handlers are preserved using API
  }

  constructor() {
    super();
  }
}

customElements.define("gilda-root", GildaCustomElement);

// logic just for this Markdown document

function updateRenderedOutput(name: string, sourceCode: string) {
  const els = document.getElementsByTagName("pre");
  for (let i = 0; i < els.length; i++) {
    if (els[i].dataset.componentOutput === name) {
      const prettyCode = html_beautify(sourceCode, {
        indent_size: "2",
        brace_style: "collapse",
        wrap_line_length: "80"
      });
      els[i].innerText = prettyCode;
      break;
    }
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const els = document.getElementsByTagName("pre");
  for (let i = 0; i < els.length; i++) {
    const pre = els[i];
    const name = pre.dataset.componentSource;
    const component = getComponentFromWindow(name);

    if (typeof component === "function") {
      const sourceCode = String(component);
      const prettyCode = js_beautify(sourceCode, {
        indent_size: "2",
        brace_style: "collapse",
        wrap_line_length: "80"
      });
      const highlightedCode = hljs.highlight(prettyCode, {
        language: "javascript"
      }).value;
      els[i].innerHTML = highlightedCode;
    }
  }
});

// your components go here

function HelloGilda({ lightness = 200 }: { lightness: number }) {
  if (lightness <= 0) {
    return el("strong", null, "Gilda");
  }
  if (lightness > 200) {
    lightness = 200;
  }

  return fragment(
    el(
      "span",
      { style: `color: rgb(${lightness} ${lightness} ${lightness})` },
      "Hello"
    ),
    el(HelloGilda, { lightness: lightness - 20 })
  );
}

function Clock() {
  const [time, setTime] = useState<number>(Date.now());
  // TODO useEffect() for cleanup
  return el(
    "p",
    null,
    fragment("Current UNIX time: ", el("strong", null, `${time}`)),
    el("br"),
    el(
      "button",
      {
        onClick: () => {
          setTime(Date.now());
        }
      },
      "Update"
    )
  );
}

function Todo() {
  const [input, setInput] = useState<string>("");
  const [items, setItems] = useState<{ done: boolean; label: string }[]>([
    { done: false, label: "First item" },
    { done: false, label: "Second item" }
  ]);

  function handleChange(e: InputEvent) {
    const target: HTMLInputElement | null =
      e.target != null ? (e.target as HTMLInputElement) : null;
    setInput(target?.value || "");
  }

  function handleClick() {
    setItems([...items, { done: false, label: input }]);
    setInput("");
  }

  return fragment(
    el("ol", null, ...items.map((item) => el("li", null, item.label))),
    el("label", { for: "new-todo" }, "New todo"),
    el("input", {
      type: "text",
      id: "new-todo",
      value: input,
      onKeyUp: handleChange
    }),
    el(
      "button",
      {
        onClick: handleClick
      },
      "Add"
    )
  );
}
