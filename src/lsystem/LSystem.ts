export class Node {
  value: string = "";
  next: Node = null;

  constructor(val: string) {
    this.value = val;
  }
};

export class LSystem {
  axiom: string;
  grammar: any;

  constructor(axiom: string, grammar: any) {
    this.axiom = axiom;
    this.grammar = grammar;
  }

  createLSystemString(iterations: number) {
    let result: Node = new Node(this.axiom[0]);

    let tempNode = result;
    for (let i: number = 1; i < this.axiom.length; ++i) {
      tempNode.next = new Node(this.axiom[i]);
      tempNode = tempNode.next;
    }

    for (let i: number = 0; i < iterations; ++i) {
      let newNode: Node;
      let tempNewNode: Node;
      let tempResult = result;

      while (tempResult != null) {
        let value: string;
        if (this.grammar[tempResult.value] === undefined) {
          value = tempResult.value;
        } else {
          value = this.grammar[tempResult.value];
        }

        for (let c of value) {
          if (newNode == undefined) {
            newNode = new Node(c);
            tempNewNode = newNode;
          } else {
            tempNewNode.next = new Node(c);
            tempNewNode = tempNewNode.next;
          }
        }

        tempResult = tempResult.next; 
      }

      result = newNode;
    }

    return result;
  }
};

export default LSystem;