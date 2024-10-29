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

type GildaElement = {
  type: Component<any> | string;
  props: { [key: string]: any };
};

type GildaNode = undefined | null | "" | 0 | string | boolean | GildaElement;

type Component<T> = (props: T) => GildaNode;

type Setter<T> = (newValue: T) => void;
type StateHook<T> = { value: T; setter: Setter<T> };

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
  let hook = currentStateHooks[hookCounter];

  if (!hook) {
    hook = {
      value: initialValue
    } as StateHook<T>;

    const container = currentContainer;
    if (container == null) {
      throw new Error('useState() must be called during render');
    }
    hook.setter = (newValue) => {
      hook.value = newValue;
      triggerUpdate(container);
    };

    currentStateHooks[hookCounter] = hook;
  }

  hookCounter++;
  return [hook.value, hook.setter];
}

function triggerUpdate(container: Container<any>) {
  const event = new Event("update");
  (event as Event & {container: Container<any>}).container = container;
  dispatchEvent(event);
}

function init(el: Element, fn: Component<any>) {
  // remove any children from container element
  el.replaceChildren();
  new Container(el, fn);
}

let hookCounter = 0;
let currentStateHooks: StateHook<any>[] = [];
let currentContainer: Container<any> | null = null;

class Container<T> {
  private component: Component<any>;
  private domElement: Element;
  private hooks: StateHook<any>[];

  constructor(el: Element, fn: Component<T>) {
    const functionName = fn.name;
    if (typeof fn !== "function") {
      throw new Error(`undefined Component: ${functionName}`);
    }

    this.component = fn;

    if (el == null) {
      throw new Error('a DOM node container is required');
    }

    el.replaceChildren();
    this.domElement = el;

    this.hooks = [];

    // update for the initial render
    this.handleUpdate();

    // further updates are caused by the 'update' event
    addEventListener("update", this.handleUpdate.bind(this));
  }

  handleUpdate() {
    // TODO only render the component that changed & its children
    currentContainer = this;
    currentStateHooks = this.hooks;
    hookCounter = 0;

    const element = this.component({});

    // temporary <div> to hold nodes in fragment
    const temp = document.createElement("div");
    const newRoot = render(element, temp);
    // replace <div> with its child nodes, eliminating the fragment
    
    temp.replaceWith(...Array.from(temp.childNodes));

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

    const currentRoot = this.domElement;

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
      this.domElement.replaceChildren(newRoot);
    }

    // TODO fix event handlers getting messed up by the diff
    // TODO make sure handlers are preserved using API
  }
}
