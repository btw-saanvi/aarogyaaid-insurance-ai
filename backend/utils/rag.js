const policies = require('../data/policies');

/**
 * Simple RAG logic: Keyword matching
 * In a real scenario, this would use embeddings.
 */
function getRelevantPolicies(userProfile) {
  const { age, lifestyle, preExistingConditions, cityTier } = userProfile;
  
  // Combine all user data into a search string
  const userQuery = `${lifestyle} ${preExistingConditions} ${cityTier}`.toLowerCase();
  
  // Score each policy
  const scoredPolicies = policies.map(policy => {
    let score = 0;
    
    // Keyword match
    policy.keywords.forEach(kw => {
      if (userQuery.includes(kw.toLowerCase())) {
        score += 5;
      }
    });

    // Strategy based matches
    if (preExistingConditions && preExistingConditions !== "None") {
      if (policy.waiting_period.toLowerCase().includes("instant") || policy.waiting_period.toLowerCase().includes("30 days")) {
        score += 10; // High score for short waiting periods if user has conditions
      }
    }

    if (lifestyle.toLowerCase().includes("active") && policy.keywords.includes("wellness")) {
      score += 5;
    }

    return { ...policy, score };
  });

  // Sort by score and return top relevant ones
  return scoredPolicies.sort((a, b) => b.score - a.score);
}

module.exports = { getRelevantPolicies };
