// simulated-ai.js

const knowledgeBase = {
    'cs': {
        name: "CS Mentor",
        fallback: "As a CS mentor, I recommend breaking the problem down. Have you checked the documentation?",
        materials: [
            { title: "MDN Web Docs", url: "https://developer.mozilla.org" },
            { title: "React Official Docs", url: "https://react.dev" },
            { title: "Node.js Guides", url: "https://nodejs.org/en/docs/" },
            { title: "Algorithms Visualization", url: "https://visualgo.net" }
        ],
        keywords: {
            'react': "React is a powerful library for UI. Key concepts: Components, Props, State (useState), Effects (useEffect). For complex state, consider Context or Redux.",
            'node': "Node.js allows JS on the server. Important: Event Loop, Non-blocking I/O, Streams, and Modules (CommonJS/ESM).",
            'db': "Databases are crucial. SQL (Postgres, MySQL) for structured data, NoSQL (MongoDB) for flexible schemas.",
            'python': "Python is great for scripting and AI. Libraries: NumPy, Pandas, Scikit-learn, PyTorch.",
            'git': "Version control is essential. Basic commands: git init, add, commit, push, pull, branch.",
            'material': "Here are some top resources for Computer Science: MDN, React Docs, CS50 on YouTube.",
            'study': "Focus on Data Structures and Algorithms (DSA). It's the foundation of efficient coding."
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
