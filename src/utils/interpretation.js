import interpretationsData from '../data/interpretations.js';

const {
  dimensionNames,
  letterDescriptions,
  scoreChangeTemplates,
  flipTemplates,
  combinationTemplates,
  thresholdTemplates,
  stabilityTemplates,
  personalityTemplates
} = interpretationsData;

const interpretation = {
  generateInterpretations: function(oldScores, newScores, oldPercentages, newPercentages, 
                                      oldPersonality, newPersonality, analysisRecords, N = 7) {
    // 如果是首次解析，不生成任何变化解读
    if (analysisRecords.length === 0) {
      return [];
    }
    
    const interpretations = [];
    const allKeys = ['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P'];
    
    const dimensionPairs = [
      { pair: 'EI', left: 'E', right: 'I' },
      { pair: 'SN', left: 'S', right: 'N' },
      { pair: 'TF', left: 'T', right: 'F' },
      { pair: 'JP', left: 'J', right: 'P' }
    ];
    
    dimensionPairs.forEach(dim => {
      const oldLeft = oldScores[dim.left];
      const newLeft = newScores[dim.left];
      const oldRight = oldScores[dim.right];
      const newRight = newScores[dim.right];
      
      const oldDominant = oldLeft > oldRight ? dim.left : dim.right;
      const newDominant = newLeft > newRight ? dim.left : dim.right;
      
      if (oldDominant !== newDominant) {
        const template = flipTemplates[`二-${dim.pair}`];
        if (template) {
          interpretations.push({
            priority: template.priority,
            text: template.template
              .replace('{oldLetter}', dimensionNames[oldDominant])
              .replace('{oldPercent}', oldPercentages[oldDominant])
              .replace('{newLetter}', dimensionNames[newDominant])
              .replace('{newPercent}', newPercentages[newDominant])
              .replace('{newDesc}', letterDescriptions[newDominant])
          });
        }
      }
    });
    
    if (oldPersonality && newPersonality && oldPersonality !== newPersonality) {
      const recentRecords = analysisRecords.slice(0, -1).slice(-N);
      const combinedPersonality = this.getCombinedPersonality(recentRecords, N);
      
      if (combinedPersonality && combinedPersonality !== newPersonality) {
        const template = personalityTemplates['六-1'];
        interpretations.push({
          priority: template.priority,
          text: template.template
            .replace('{N}', N)
            .replace('{oldPersonality}', combinedPersonality)
            .replace('{newPersonality}', newPersonality)
        });
      }
    }
    
    allKeys.forEach(key => {
      const change = Number((newScores[key] - oldScores[key]).toFixed(2));
      
      if (Math.abs(change) >= 0.5) {
        Object.keys(scoreChangeTemplates).forEach(templateKey => {
          const template = scoreChangeTemplates[templateKey];
          if (template.match(change)) {
            interpretations.push({
              priority: template.priority,
              text: template.template
                .replace('{dimension}', dimensionNames[key])
                .replace('{oldPercent}', oldPercentages[key])
                .replace('{newPercent}', newPercentages[key])
            });
          }
        });
      }
    });
    
    const thresholds = [50, 60, 75, 90];
    allKeys.forEach(key => {
      thresholds.forEach(threshold => {
        if (oldPercentages[key] < threshold && newPercentages[key] >= threshold) {
          const template = thresholdTemplates[`四-${thresholds.indexOf(threshold) + 1}`];
          if (template) {
            interpretations.push({
              priority: template.priority,
              text: template.template
                .replace('{dimension}', dimensionNames[key])
                .replace('{oldPercent}', oldPercentages[key])
                .replace('{newPercent}', newPercentages[key])
            });
          }
        }
      });
    });
    
    if (analysisRecords.length >= 3) {
      const recentChanges = [];
      for (let i = analysisRecords.length - 1; i > Math.max(0, analysisRecords.length - 6); i--) {
        if (i > 0) {
          const prevView = analysisRecords[i - 1];
          const currView = analysisRecords[i];
          const change = {};
          allKeys.forEach(key => {
            change[key] = currView.rolling_scores[key] - prevView.rolling_scores[key];
          });
          recentChanges.push(change);
        }
      }
      
      allKeys.forEach(key => {
        const upCount = recentChanges.filter(c => c[key] > 0.3).length;
        const downCount = recentChanges.filter(c => c[key] < -0.3).length;
        const stableCount = recentChanges.filter(c => Math.abs(c[key]) < 0.3).length;
        
        if (upCount >= 3) {
          const template = upCount >= 5 ? stabilityTemplates['五-2'] : stabilityTemplates['五-1'];
          interpretations.push({
            priority: template.priority,
            text: template.template
              .replace('{dimension}', dimensionNames[key])
              .replace('{count}', upCount)
          });
        } else if (downCount >= 3) {
          const template = downCount >= 5 ? stabilityTemplates['五-4'] : stabilityTemplates['五-3'];
          interpretations.push({
            priority: template.priority,
            text: template.template
              .replace('{dimension}', dimensionNames[key])
              .replace('{count}', downCount)
          });
        } else if (stableCount >= 3) {
          const template = stabilityTemplates['五-5'];
          interpretations.push({
            priority: template.priority,
            text: template.template
              .replace('{dimension}', dimensionNames[key])
              .replace('{count}', stableCount)
          });
        }
      });
    }
    
    Object.keys(combinationTemplates).forEach(key => {
      const template = combinationTemplates[key];
      const conditions = template.conditions;
      let match = true;
      
      conditions.forEach(cond => {
        const change = newScores[cond.key] - oldScores[cond.key];
        if (cond.change === 'up' && change <= 0.3) match = false;
        if (cond.change === 'down' && change >= -0.3) match = false;
      });
      
      if (match) {
        interpretations.push({
          priority: template.priority,
          text: template.template
        });
      }
    });
    
    const recentRecords = analysisRecords.slice(0, -1).slice(-N);
    const combinedPersonality = this.getCombinedPersonality(recentRecords, N);
    
    if (combinedPersonality && combinedPersonality !== newPersonality) {
      const template = personalityTemplates['六-2'];
      interpretations.push({
        priority: template.priority,
        text: template.template
          .replace('{N}', N)
          .replace('{combinedPersonality}', combinedPersonality)
          .replace('{currentPersonality}', newPersonality)
      });
    }
    
    interpretations.sort((a, b) => a.priority - b.priority);
    
    return interpretations.slice(0, 3);
  },
  
  getCombinedPersonality: function(records, N) {
    if (records.length === 0) return null;

    const recentRecords = records.slice(-N);
    const combinedScores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };

    recentRecords.forEach(view => {
      Object.keys(combinedScores).forEach(key => {
        combinedScores[key] += view.raw_scores[key];
      });
    });
    
    const dimensions = [
      { left: 'E', right: 'I' },
      { left: 'S', right: 'N' },
      { left: 'T', right: 'F' },
      { left: 'J', right: 'P' }
    ];
    
    let personality = '';
    dimensions.forEach(d => {
      personality += combinedScores[d.left] > combinedScores[d.right] ? d.left : d.right;
    });
    
    return personality;
  }
};

export default interpretation;
