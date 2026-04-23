# AarogyaAid AI Policy Recommender — PRD

## 1. User Profile

The primary user of this platform is an adult (age 25–60) who is trying to purchase health insurance for the first time or reconsider an existing policy. The user may have limited knowledge of insurance terms and is often unsure how different policies compare.

A key characteristic of this user is uncertainty and anxiety. They are making a high-stakes financial decision that directly impacts their health and future. Many users may also be disclosing pre-existing conditions (like diabetes or hypertension) for the first time in a digital setting, which makes them cautious and sensitive to how the system responds.

Their biggest fear is choosing the wrong policy — either one that is too expensive, has hidden exclusions, or fails them during a medical emergency.


## 2. Problem Statement

Health insurance selection in India is a confusing and overwhelming process. Users typically rely on comparison platforms that show multiple policies but do not explain which one is actually suitable for their personal situation.

Some of the key problems are:
- Insurance policies contain complex terms like waiting periods, co-pay, and exclusions that are difficult to understand.
- Users do not know how their personal health conditions affect policy eligibility and cost.
- Existing platforms focus on listing options rather than guiding decisions.

This platform aims to solve these issues by providing a personalized, explainable recommendation using an AI agent that understands both the user’s profile and policy details.


### Features

1. Profile Form (6 fields)  
   This is the entry point for personalization and drives the entire recommendation process.

2. AI Recommendation Engine  
   Core feature that generates:
   - Peer comparison table
   - Coverage details
   - Personalized explanation

3. RAG Pipeline with Policy Documents  
   Ensures all recommendations are grounded in real policy data and not hallucinated.

4. Chat Explainer  
   Allows users to ask follow-up questions and understand insurance terms in simple language.

5. Admin Panel (Upload/Delete Policies)  
   Enables dynamic updating of policy knowledge without code changes.


## 4. Recommendation Logic

The recommendation logic is based on mapping each user profile field to relevant policy attributes. Instead of hardcoding decisions, the system retrieves relevant document sections and uses them to generate reasoning.

The six input fields influence the recommendation as follows:

- **Age**  
  Older users are more sensitive to higher premiums and longer waiting periods. Policies with shorter waiting periods and stable coverage are preferred.

- **Lifestyle**  
  Active users may benefit from policies that include preventive care or OPD coverage. Sedentary users may require more hospitalization-focused coverage.

- **Pre-existing Conditions**  
  This is the most important factor. The system prioritizes:
  - Policies that cover the condition
  - Shorter waiting periods for that condition
  - Fewer exclusions

- **Annual Income**  
  Determines affordability. The system avoids recommending policies where the premium is too high relative to income. It also adjusts the target coverage amount.

- **City / Tier**  
  Affects hospital network availability and claim reliability. Users in Tier-2 or Tier-3 cities may need policies with wider hospital networks.

- **Full Name**  
  Used for personalization in responses to make the interaction feel more human and empathetic.

The system retrieves relevant policy clauses using RAG and then generates:
- A comparison table across policies
- Detailed coverage breakdown
- A personalized explanation linking policy features to the user’s profile

If no perfect match exists, the system still provides the closest options and clearly explains the limitations instead of returning no result.



## 5. Assumptions

The following assumptions are made for this prototype:

- Policy documents are reasonably structured and contain extractable text.
- Users provide truthful and accurate information about their health conditions.
- Premium values and coverage details are present in the documents.
- The number of policies is small (at least 3) and manageable within a simple vector store.
- The AI model can follow instructions to avoid hallucination when properly prompted.

These assumptions would need validation in a real production system.


## 6. Out of Scope

The following features are intentionally not included:

- Real-time premium calculation based on external APIs
- Integration with insurance providers
- User authentication and account history
- Advanced document parsing for highly complex PDF layouts
- Multi-language support

These are excluded to focus on the core problem: building a grounded, explainable AI recommendation system within the given time.


## 7. Summary

This system is designed to go beyond a simple comparison tool by acting as an AI assistant that helps users understand and choose the right health insurance policy.

The focus is on:
- Personalization using user profile data
- Grounded recommendations using policy documents (RAG)
- Clear and empathetic explanations

The goal is not just to show options, but to help the user feel confident in their decision.