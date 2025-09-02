# Product Scorecard
{{product_name}}

## Executive Summary
**Health Score**: {{overall_health}}/100
**Trend**: {{trend_direction}} ({{trend_percentage}} from last period)

## AAARRR Metrics Dashboard

### Awareness
- **Metric**: {{awareness_metric}}
- **Current**: {{awareness_current}}
- **Target**: {{awareness_target}}
- **Status**: {{awareness_status}}
- **Key Insight**: {{awareness_insight}}

### Acquisition
- **Metric**: {{acquisition_metric}}
- **Current**: {{acquisition_current}}
- **Target**: {{acquisition_target}}
- **Status**: {{acquisition_status}}
- **Key Insight**: {{acquisition_insight}}

### Activation
- **Metric**: {{activation_metric}}
- **Current**: {{activation_current}}
- **Target**: {{activation_target}}
- **Status**: {{activation_status}}
- **Key Insight**: {{activation_insight}}

### Retention
- **Metric**: {{retention_metric}}
- **Current**: {{retention_current}}
- **Target**: {{retention_target}}
- **Status**: {{retention_status}}
- **Key Insight**: {{retention_insight}}

### Revenue
- **Metric**: {{revenue_metric}}
- **Current**: {{revenue_current}}
- **Target**: {{revenue_target}}
- **Status**: {{revenue_status}}
- **Key Insight**: {{revenue_insight}}

### Referral
- **Metric**: {{referral_metric}}
- **Current**: {{referral_current}}
- **Target**: {{referral_target}}
- **Status**: {{referral_status}}
- **Key Insight**: {{referral_insight}}

## Three Values Assessment

### Business Value
{{business_value_assessment}}
- **Key Metric**: {{business_key_metric}}
- **Performance**: {{business_performance}}

### Customer Value
{{customer_value_assessment}}
- **Key Metric**: {{customer_key_metric}}
- **Performance**: {{customer_performance}}

### User Value
{{user_value_assessment}}
- **Key Metric**: {{user_key_metric}}
- **Performance**: {{user_performance}}

## Leading Indicators
{{#each leading_indicators}}
- **{{indicator_name}}**: {{current_value}} ({{change}} from last period)
  - What it tells us: {{interpretation}}
{{/each}}

## Action Items Based on Data
{{#each action_items}}
1. **{{action}}**: {{rationale}}
   - Expected Impact: {{impact}}
   - Owner: {{owner}}
{{/each}}

## Cohort Analysis Highlights
{{cohort_insights}}

---
*Data tells a story. This scorecard shows where we are and where we need to focus.*

---END ASSET---