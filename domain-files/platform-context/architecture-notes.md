# Wayscribe Architecture Notes

## Core Pattern: Micromodels as Compressed Expertise

The architecture embodies a fundamental insight: domains are "compressed expertise" that Claude decompresses into personalized consultations. Like jazz charts rather than sheet music - structure without prescription.

## Content Access Philosophy

### MCP Connector Reality
MCP Connector only supports tools, not Resources. All domain content must flow through tool responses:

```javascript
// At build time - bundle everything
const DOMAIN = {
  knowledge: { book: '[entire book content]' },
  systemInstructions: '[consultation approach]',
  templates: { 'three-i-analysis': '[template]' },
  configs: { /* all 6 configs */ }
};

// At runtime - serve through tools
tools: [
  {
    name: "welcome",
    // Returns welcome message with embedded domain context
  },
  {
    name: "consult",
    // Applies domain knowledge in responses
  }
]
```

### Knowledge Integration
Since we can't use Resources, domain expertise gets woven into tool responses:
- Welcome tool embeds initial domain context
- Consult tool applies knowledge to user situations
- Templates structure deliverables within responses
- System instructions guide consultation approach

The bundled architecture ensures instant access without file I/O.

## Tool Flow as Consultation Architecture

### Two-Tool Symphony
```javascript
tools: [
  { name: "welcome", description: "Initialize consultation..." },
  { name: "consult", description: "Continue consultation..." }
]
```

Just two tools mirror natural human interaction:
1. "Hello, I need help with..." (welcome)
2. "Here's my situation..." (consult)

Deliverables aren't a separate tool - they emerge naturally from consultation depth.

### Rich Descriptions Matter
Tool descriptions aren't documentation - they're behavioral programming. Compare:
- Weak: "Processes user input"
- Strong: "Continue the consultation by applying domain expertise to the user's situation"

The description shapes how Claude approaches the tool usage.

## Configuration as Philosophy

### All 6 Configs Encode Values

Even "unused" configs like state and synthesis provide essential context:

**state-config.json**: What progress milestones the expert values
**synthesis-config.json**: How the expert prioritizes personalization
**onboarding-config.json**: The expert's philosophy on user readiness

These aren't technical specs - they're encoded expertise about what matters.

### The Objective as North Star

**synthesis-config.json** now includes an "objective" field that defines the domain's business purpose. This single field cascades through every consultation decision:

- **Lead generation domains**: Qualify prospects while educating
- **Education domains**: Transform understanding and enable action  
- **Navigation domains**: Guide to right solution efficiently

The objective isn't just documentation - it's the success criteria for every interaction. All other configs support achieving this objective.

### Orchestration Trinity
```json
{
  "behavior": {
    "intensity": 5,      // How deep to dig
    "directiveness": 6,  // How strongly to guide
    "pacing": 5         // How quickly to progress
  }
}
```

These numbers create consultation personality:
- 3/7/8: Gentle exploration, strong guidance, quick action
- 8/3/3: Deep investigation, self-discovery, patient pace

### Synthesis Personalization
```json
{
  "personalization_settings": {
    "language_matching": "mirror_user_patterns",  // or "maintain_expert_voice"
    "native_language": "offer_when_struggling"    // or "not_offered"
  }
}
```

These settings shape linguistic adaptation:

**language_matching**:
- `mirror_user_patterns`: Match user's vocabulary, complexity, and style. If they speak simply, respond simply.
- `maintain_expert_voice`: Preserve domain terminology and sophisticated language as expertise signaling.

**native_language**:
- `offer_when_struggling`: Detect language barriers and proactively offer native language support.
- `not_offered`: Professional contexts where English fluency is expected.

## Meta Files as Performance Accelerators

### getting-started.md
First thing Claude reads. Sets mental model for entire domain in <30 seconds.

### manifest-config.json
Custom tool descriptions prevent generic interpretations.

### welcome-config.json
Entry patterns and triggers create immediate context recognition.

Small files, massive impact on consultation quality.

## The Single Server Hypothesis

### Complexity Doesn't Equal Capability
7-server architecture proves the concept but may add unnecessary interpretation overhead. The hypothesis:

**Claude needs patterns, not processes.**

Single server provides:
- Clear tool flow (welcome → consult)
- Direct resource access
- Unified configuration
- Simpler mental model

### Bundle Everything
```javascript
const DOMAIN = {
  knowledge: { book: '...' },     // All content in memory
  configs: { /* all 6 */ },       // Complete philosophy
  templates: { /* all */ },       // Ready structures
  systemInstructions: '...'       // Consultation approach
};
```

No file I/O, no inter-server communication, just pure consultation patterns.

## Platform Standards Enable Scale

### Harmonized Structure
Every domain follows identical structure:
- 6 standard configs (even if some feel "optional")
- Consistent meta files
- Same resource patterns
- Predictable tool flow

This isn't bureaucracy - it's what enables platform scaling.

### Templates as Starting Points
Templates use semantic variables:
```markdown
## {{framework_name}} Analysis for {{company_name}}
```

Not:
```markdown
## {{step_1_title}}: {{step_1_content}}
```

Trust Claude to interpret expertise, don't over-specify.

## Performance Insights

### What Accelerates Understanding
1. Meta files for quick orientation
2. Vision documents for mission alignment
3. Rich tool descriptions for behavioral guidance
4. Complete configs for philosophy encoding
5. Clean templates for flexibility

### What Slows Understanding
1. Complex orchestration logic
2. Defensive programming
3. Over-specified templates
4. Missing philosophical context
5. Generic tool descriptions

## Deployment Philosophy

### Single Domain = Single Deployment
- pr-confidential.wayscribe.ai
- signal-product.wayscribe.ai
- smarter-premed.wayscribe.ai

Natural business boundaries. Each expert owns their infrastructure.

### Invisible Excellence
The best architecture disappears. Experts embed consultations on their sites. Users experience expertise, not platform.

## The Core Insight

**Architecture should encode consultation wisdom, not just enable tool execution.**

Every architectural decision should ask:
1. Does this help Claude deliver better consultations?
2. Does this make expertise more accessible?
3. Does this create more value for users?

The best architecture is one that makes $50/month feel like a bargain for the transformation received.