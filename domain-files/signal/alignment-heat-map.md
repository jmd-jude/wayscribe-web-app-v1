# Alignment Heat Map
{{company_name}}

## Executive Summary
{{summary_statement}}

## Alignment Scores by Function

### Strategy & Vision Understanding
| Function | Score | Gap Analysis |
|----------|-------|--------------|
| Product | {{product_strategy_score}}/5 | {{product_strategy_gap}} |
| Engineering | {{eng_strategy_score}}/5 | {{eng_strategy_gap}} |
| Marketing | {{marketing_strategy_score}}/5 | {{marketing_strategy_gap}} |
| Sales | {{sales_strategy_score}}/5 | {{sales_strategy_gap}} |
| Support | {{support_strategy_score}}/5 | {{support_strategy_gap}} |

**Critical Gap:** {{biggest_strategy_gap}}

### Product Knowledge & Capabilities
| Function | Score | Gap Analysis |
|----------|-------|--------------|
| Product | {{product_knowledge_score}}/5 | Baseline |
| Engineering | {{eng_knowledge_score}}/5 | {{eng_knowledge_gap}} |
| Marketing | {{marketing_knowledge_score}}/5 | {{marketing_knowledge_gap}} |
| Sales | {{sales_knowledge_score}}/5 | {{sales_knowledge_gap}} |
| Support | {{support_knowledge_score}}/5 | {{support_knowledge_gap}} |

**Critical Gap:** {{biggest_knowledge_gap}}

### Process & Systems Alignment
| Area | Process | Systems | Alignment |
|------|---------|---------|-----------|
| Strategic Planning | {{strategic_process}} | {{strategic_systems}} | {{strategic_alignment}} |
| Development Workflow | {{dev_process}} | {{dev_systems}} | {{dev_alignment}} |
| Customer Learning | {{learning_process}} | {{learning_systems}} | {{learning_alignment}} |
| Release Management | {{release_process}} | {{release_systems}} | {{release_alignment}} |

## Heat Map Visualization
```
        High Alignment  →→→  Low Alignment
        🟩 (4.5-5)  🟨 (3.5-4.4)  🟠 (2.5-3.4)  🔴 (1-2.4)

Strategy:    {{strategy_heat_visual}}
Knowledge:   {{knowledge_heat_visual}}
Process:     {{process_heat_visual}}
```

## Priority Gaps Requiring Action

### 🔴 Critical (Immediate Action)
{{#each critical_gaps}}
- **{{gap_name}}**: {{gap_description}} → {{recommended_action}}
{{/each}}

### 🟠 Important (30-Day Plan)
{{#each important_gaps}}
- **{{gap_name}}**: {{gap_description}} → {{recommended_action}}
{{/each}}

### 🟨 Moderate (Quarterly Focus)
{{#each moderate_gaps}}
- **{{gap_name}}**: {{gap_description}} → {{recommended_action}}
{{/each}}

## Quick Wins Available
{{#each quick_wins}}
1. **{{win_title}}**: {{win_description}}
   - Effort: {{effort_level}}
   - Impact: {{impact_level}}
   - Timeline: {{timeline}}
{{/each}}

## Recommended Next Steps

### Immediate (Week 1)
{{immediate_actions}}

### Short-term (30 Days)
{{short_term_actions}}

### Strategic (90 Days)
{{strategic_actions}}

---

*Remember: Alignment is not a one-time fix but an ongoing capability. Focus on building systematic communication and shared understanding.*

---END ASSET---