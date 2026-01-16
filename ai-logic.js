// simulated-ai.js

const knowledgeBase = {
    'cs': {
        name: "CS Mentor",
        fallback: "That's an interesting question! As a CS mentor, I recommend breaking down complex problems into smaller parts. Can you tell me more about what you're trying to learn or solve?",
        materials: [
            { title: "MDN Web Docs", url: "https://developer.mozilla.org" },
            { title: "React Official Docs", url: "https://react.dev" },
            { title: "Node.js Guides", url: "https://nodejs.org/en/docs/" },
            { title: "Algorithms Visualization", url: "https://visualgo.net" },
            { title: "JavaScript.info", url: "https://javascript.info" },
            { title: "FreeCodeCamp", url: "https://www.freecodecamp.org" },
            { title: "LeetCode Practice", url: "https://leetcode.com" }
        ],
        keywords: {
            // Basic Coding Concepts
            'variable': "Variables store data values. In JavaScript:\n• let x = 5; (can be reassigned)\n• const PI = 3.14; (cannot be reassigned)\n• var old = 'legacy'; (function-scoped, avoid in modern code)\n\nTip: Use 'const' by default, 'let' when you need to reassign.",

            'data type': "JavaScript has 7 primitive types:\n1. String: 'hello' or \"world\"\n2. Number: 42, 3.14\n3. Boolean: true, false\n4. Undefined: variable declared but not assigned\n5. Null: intentional absence of value\n6. Symbol: unique identifier\n7. BigInt: large integers\n\nPlus Object (non-primitive) for complex data structures.",

            'loop': "Loops repeat code blocks:\n\n• for loop: for(let i=0; i<5; i++) { console.log(i); }\n• while loop: while(condition) { /* code */ }\n• for...of: for(let item of array) { /* code */ }\n• forEach: array.forEach(item => { /* code */ })\n\nTip: Use for...of for arrays, for...in for objects.",

            'conditional': "Conditionals control program flow:\n\nif (age >= 18) {\n  console.log('Adult');\n} else if (age >= 13) {\n  console.log('Teen');\n} else {\n  console.log('Child');\n}\n\nTernary: const status = age >= 18 ? 'Adult' : 'Minor';\nSwitch: Use for multiple specific values.",

            'function': "Functions are reusable code blocks:\n\n// Function declaration\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\n// Arrow function (modern)\nconst greet = (name) => `Hello, ${name}!`;\n\n// Function with default params\nconst greet = (name = 'Guest') => `Hello, ${name}!`;",

            // Data Structures
            'array': "Arrays store ordered collections:\n\nconst fruits = ['apple', 'banana', 'orange'];\n\nCommon methods:\n• push() - add to end\n• pop() - remove from end\n• shift() - remove from start\n• unshift() - add to start\n• map() - transform each element\n• filter() - select elements\n• reduce() - combine elements\n\nTip: Arrays are 0-indexed!",

            'object': "Objects store key-value pairs:\n\nconst person = {\n  name: 'Alice',\n  age: 25,\n  greet() { return `Hi, I'm ${this.name}`; }\n};\n\nAccess: person.name or person['name']\nAdd: person.job = 'Developer'\nDelete: delete person.age",

            'linked list': "Linked Lists are nodes connected by pointers:\n\nclass Node {\n  constructor(data) {\n    this.data = data;\n    this.next = null;\n  }\n}\n\nAdvantages: Dynamic size, easy insertion/deletion\nDisadvantages: No random access, extra memory for pointers\n\nUse when: Frequent insertions/deletions at beginning",

            'stack': "Stack: Last-In-First-Out (LIFO) structure\n\nOperations:\n• push() - add to top\n• pop() - remove from top\n• peek() - view top\n\nUse cases: Undo functionality, browser history, function call stack\n\nImplement with array: const stack = []; stack.push(1); stack.pop();",

            'queue': "Queue: First-In-First-Out (FIFO) structure\n\nOperations:\n• enqueue() - add to back\n• dequeue() - remove from front\n• peek() - view front\n\nUse cases: Task scheduling, breadth-first search, print queue\n\nImplement: Use array with push() and shift()",

            'hash': "Hash Tables (Objects/Maps) provide O(1) lookup:\n\nconst map = new Map();\nmap.set('key', 'value');\nmap.get('key'); // 'value'\n\nUse for: Fast lookups, counting occurrences, caching\n\nCollision handling: Chaining or open addressing",

            'tree': "Trees are hierarchical data structures:\n\n• Binary Tree: Each node has ≤2 children\n• BST: Left < Parent < Right\n• Balanced Tree: Height difference ≤1\n\nTraversals:\n• Inorder: Left → Root → Right\n• Preorder: Root → Left → Right\n• Postorder: Left → Right → Root\n\nUse: File systems, DOM, decision trees",

            // OOP
            'class': "Classes are blueprints for objects:\n\nclass Car {\n  constructor(brand, model) {\n    this.brand = brand;\n    this.model = model;\n  }\n  \n  drive() {\n    return `${this.brand} ${this.model} is driving`;\n  }\n}\n\nconst myCar = new Car('Toyota', 'Camry');\nmyCar.drive();",

            'oop': "Object-Oriented Programming has 4 pillars:\n\n1. Encapsulation: Bundle data and methods\n2. Abstraction: Hide complex details\n3. Inheritance: Reuse code from parent class\n4. Polymorphism: Same interface, different implementations\n\nBenefits: Code reusability, modularity, easier maintenance",

            'inheritance': "Inheritance allows classes to extend others:\n\nclass Animal {\n  constructor(name) { this.name = name; }\n  speak() { return 'Some sound'; }\n}\n\nclass Dog extends Animal {\n  speak() { return `${this.name} barks!`; }\n}\n\nconst dog = new Dog('Rex');\ndog.speak(); // 'Rex barks!'",

            // Algorithms
            'algorithm': "Algorithms are step-by-step problem-solving procedures.\n\nKey concepts:\n• Correctness: Produces right output\n• Efficiency: Time and space complexity\n• Clarity: Easy to understand\n\nCommon types: Sorting, searching, graph traversal, dynamic programming",

            'big o': "Big O notation describes algorithm efficiency:\n\n• O(1) - Constant: Array access\n• O(log n) - Logarithmic: Binary search\n• O(n) - Linear: Loop through array\n• O(n log n) - Linearithmic: Merge sort\n• O(n²) - Quadratic: Nested loops\n• O(2ⁿ) - Exponential: Recursive fibonacci\n\nTip: Focus on worst-case scenario!",

            'sorting': "Common sorting algorithms:\n\n• Bubble Sort: O(n²) - Simple, swap adjacent\n• Merge Sort: O(n log n) - Divide & conquer\n• Quick Sort: O(n log n) avg - Pivot-based\n• Insertion Sort: O(n²) - Good for small/nearly sorted\n\nJavaScript: array.sort((a,b) => a - b)",

            'search': "Searching algorithms:\n\n• Linear Search: O(n) - Check each element\n• Binary Search: O(log n) - Divide sorted array in half\n\nBinary search example:\nlet mid = Math.floor((left + right) / 2);\nif (arr[mid] === target) return mid;\nelse if (arr[mid] < target) left = mid + 1;\nelse right = mid - 1;",

            'recursion': "Recursion: Function calling itself\n\nfunction factorial(n) {\n  if (n <= 1) return 1; // Base case\n  return n * factorial(n - 1); // Recursive case\n}\n\nKey: Always have a base case to prevent infinite recursion!\n\nUse for: Tree traversal, divide & conquer, backtracking",

            // Web Development
            'html': "HTML structures web content:\n\n• Semantic tags: <header>, <nav>, <main>, <footer>\n• Forms: <input>, <button>, <select>\n• Media: <img>, <video>, <audio>\n\nBest practice: Use semantic HTML for accessibility and SEO",

            'css': "CSS styles web pages:\n\n• Selectors: .class, #id, element\n• Box model: margin, border, padding, content\n• Flexbox: display: flex; for 1D layouts\n• Grid: display: grid; for 2D layouts\n• Responsive: @media queries\n\nTip: Mobile-first design approach!",

            'dom': "DOM (Document Object Model) represents HTML as objects:\n\n• Select: document.querySelector('.class')\n• Modify: element.textContent = 'New text'\n• Create: document.createElement('div')\n• Events: element.addEventListener('click', fn)\n\nDOM manipulation is how JavaScript makes pages interactive!",

            'api': "APIs allow programs to communicate:\n\n• REST: Uses HTTP methods (GET, POST, PUT, DELETE)\n• Fetch API:\n  fetch('url')\n    .then(res => res.json())\n    .then(data => console.log(data))\n    .catch(err => console.error(err))\n\n• Status codes: 200 OK, 404 Not Found, 500 Server Error",

            'async': "Asynchronous JavaScript handles delayed operations:\n\n• Callbacks: function(err, data) {}\n• Promises: .then().catch()\n• Async/Await (modern):\n\nasync function getData() {\n  try {\n    const response = await fetch('url');\n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error(error);\n  }\n}",

            'react': "React is a UI library. Key concepts:\n\n• Components: Reusable UI pieces\n• Props: Pass data to components\n• State (useState): Component memory\n• Effects (useEffect): Side effects\n• JSX: HTML-like syntax in JavaScript\n\nExample:\nfunction Greeting({ name }) {\n  return <h1>Hello, {name}!</h1>;\n}",

            'node': "Node.js runs JavaScript on servers:\n\n• Event Loop: Non-blocking I/O\n• Modules: require() or import\n• NPM: Package manager\n• Express: Web framework\n\nSimple server:\nconst express = require('express');\nconst app = express();\napp.get('/', (req, res) => res.send('Hello!'));\napp.listen(3000);",

            // Debugging & Best Practices
            'debug': "Debugging tips:\n\n1. console.log() - Print values\n2. console.table() - Display arrays/objects\n3. debugger; - Pause execution\n4. Browser DevTools - Inspect, breakpoints\n5. Read error messages carefully!\n\nCommon errors:\n• Syntax: Missing brackets, semicolons\n• Reference: Variable not defined\n• Type: Wrong data type used",

            'error': "Error handling prevents crashes:\n\ntry {\n  // Code that might fail\n  const data = JSON.parse(input);\n} catch (error) {\n  // Handle the error\n  console.error('Parsing failed:', error.message);\n} finally {\n  // Always runs\n  cleanup();\n}\n\nThrow custom errors: throw new Error('Invalid input');",

            'best practice': "Coding best practices:\n\n1. DRY (Don't Repeat Yourself) - Reuse code\n2. Meaningful names: getUserData() not gd()\n3. Keep functions small and focused\n4. Comment WHY, not WHAT\n5. Consistent formatting (use Prettier)\n6. Handle errors gracefully\n7. Test your code\n8. Version control (Git)\n\nRemember: Code is read more than written!",

            'git': "Git is version control:\n\nBasic workflow:\n1. git init - Initialize repo\n2. git add . - Stage changes\n3. git commit -m 'message' - Save snapshot\n4. git push - Upload to remote\n5. git pull - Download updates\n\nBranching:\n• git branch feature - Create branch\n• git checkout feature - Switch branch\n• git merge feature - Combine branches",

            'db': "Databases store data persistently:\n\n• SQL (Relational): PostgreSQL, MySQL\n  - Structured tables with relationships\n  - Use SQL queries: SELECT, INSERT, UPDATE, DELETE\n  \n• NoSQL (Non-relational): MongoDB, Redis\n  - Flexible schemas\n  - Good for unstructured data\n\nChoose based on: Data structure, scalability needs, consistency requirements",

            'python': "Python is great for beginners and AI:\n\n• Clean syntax: Indentation matters!\n• Libraries: NumPy, Pandas, Scikit-learn, PyTorch\n• Use cases: Data science, ML, automation, web (Django/Flask)\n\nExample:\ndef greet(name):\n    return f'Hello, {name}!'\n\nprint(greet('World'))",

            'material': "Here are top resources for Computer Science:\n\n📚 Learning Platforms:\n• FreeCodeCamp - Interactive tutorials\n• JavaScript.info - Comprehensive JS guide\n• MDN Web Docs - Web development reference\n• CS50 (Harvard) - Free CS course\n\n🎯 Practice:\n• LeetCode - Algorithm problems\n• HackerRank - Coding challenges\n• Visualgo.net - Algorithm visualization\n\nWhat specific topic are you interested in?",

            'study': "Effective CS study strategies:\n\n1. Master fundamentals first (variables, loops, functions)\n2. Practice coding daily - consistency > intensity\n3. Build projects - apply what you learn\n4. Read others' code - learn different approaches\n5. Explain concepts to others - test understanding\n6. Debug without immediately googling - develop problem-solving\n7. Use spaced repetition for algorithms\n\nFocus on understanding WHY, not just HOW!"
        }
    },
    'mech': {
        name: "Mech Mentor",
        fallback: "In Mechanical Engineering, precision is key. Double check your FBD (Free Body Diagram).",
        materials: [
            { title: "MIT OpenCourseWare - MechEng", url: "https://ocw.mit.edu/courses/mechanical-engineering/" },
            { title: "Engineering Toolbox", url: "https://www.engineeringtoolbox.com/" },
            { title: "MatWeb Material Properties", url: "https://www.matweb.com/" }
        ],
        keywords: {
            'thermo': "Thermodynamics laws: 0) Equilibrium, 1) Energy Conservation, 2) Entropy increases, 3) Absolute Zero. Key: PV=nRT.",
            'solid': "Mechanics of Materials: Stress = Force/Area. Strain = Deformation/Length. Young's Modulus E = Stress/Strain.",
            'fluid': "Bernoulli's Equation: P + 0.5ρv² + ρgh = constant. Laminar vs Turbulent flow (Reynolds Number).",
            'cad': "CAD tools: SolidWorks, AutoCAD, Fusion 360. Always define your sketches fully!",
            'gear': "Gear Ratio = Input Speed / Output Speed = Output Torque / Input Torque.",
            'material': "Check out Engineering Toolbox and MatWeb for material properties.",
            'study': "Practice drawing Free Body Diagrams (FBDs) for every problem. It clarifies forces."
        }
    },
    'civil': {
        name: "Civil Mentor",
        fallback: "Safety and stability are paramount. Have you calculated the loads correctly?",
        materials: [
            { title: "ASCE Library", url: "https://ascelibrary.org/" },
            { title: "Civil Engineering Dictionary", url: "http://www.civilengineeringterms.com/" }
        ],
        keywords: {
            'structure': "Structural Analysis: Determine internal forces (axial, shear, moment). Method of Joints or Sections for Trusses.",
            'concrete': "Reinforced Concrete: Concrete takes compression; Steel rebar takes tension. Water-cement ratio affects strength.",
            'soil': "Geotechnical: Bearing capacity, Shear strength (Coulomb's Law), Consolidation, Slope stability.",
            'fluid': "Hydraulics: Open channel flow (Manning's Equation), Pipe flow (Darcy-Weisbach).",
            'bridge': "Bridge types: Beam, Arch, Truss, Suspension, Cable-stayed. Load distribution is critical.",
            'material': "Refer to ACI codes for concrete and AISC for steel design standards.",
            'study': "Understand load paths. How does gravity get from the beam to the column to the foundation?"
        }
    },
    'electrical': {
        name: "Electrical Mentor",
        fallback: "Check your connections and ground. Is the circuit complete?",
        materials: [
            { title: "All About Circuits", url: "https://www.allaboutcircuits.com/" },
            { title: "Arduino Reference", url: "https://www.arduino.cc/reference/en/" },
            { title: "Falstad Circuit Simulator", url: "https://www.falstad.com/circuit/" }
        ],
        keywords: {
            'circuit': "Circuit Basics: Ohm's Law (V=IR), Kirchhoff's Laws (KCL, KVL). Series vs Parallel.",
            'ac': "AC analysis: Impedance (Z), Phasors, RMS values. Power factor = Real Power / Apparent Power.",
            'digital': "Digital Logic: AND, OR, NOT, XOR. Boolean Algebra. Sequential logic (Flip-Flops).",
            'signal': "Signals: Fourier Transform converts Time Domain to Frequency Domain. Filters (Low/High/Band-pass).",
            'arduino': "Microcontrollers: GPIO, PWM, ADC/DAC, I2C, SPI, UART. Watch your current limits (~20mA per pin).",
            'material': "All About Circuits is fantastic. Use Falstad for simulation.",
            'study': "Build things! Simulation is good, but breadboarding teaches you about real-world noise and connections."
        }
    }
};

function getResponse(message, persona = 'cs') {
    const lowerMsg = message.toLowerCase();
    const bot = knowledgeBase[persona] || knowledgeBase['cs'];



    // 1. Check for "material" or "link" request explicitly
    if (lowerMsg.includes('material') || lowerMsg.includes('resource') || lowerMsg.includes('link') || lowerMsg.includes('book')) {

        let response = `Here are some recommended resources for ${bot.name}:\n`;
        if (bot.materials) {
            bot.materials.forEach(m => {
                response += `- ${m.title}: ${m.url}\n`;
            });
        }
        return response;
    }

    // 2. Keyword matching
    for (const [key, reply] of Object.entries(bot.keywords)) {
        if (lowerMsg.includes(key)) {
            return reply;
        }
    }

    // 3. Generic greetings
    if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('hey')) {
        return `Hello! I am your ${bot.name}. Ask me about your subjects or for study materials!`;
    }

    // 4. Feature matching (Simple NLP simulation)
    if (lowerMsg.includes('help')) {
        return "I can explain concepts, give study tips, or provide reference materials. What topic are you stuck on?";
    }

    // 5. Fallback
    return bot.fallback;
}

module.exports = { getResponse };
