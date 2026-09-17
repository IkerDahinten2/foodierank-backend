/**
 * Calcula el ranking ponderado de un conjunto de reseñas.
 * @param {Array} reviews - Lista de reseñas asociadas al restaurante.
 * @returns {number} Ranking redondeado a 2 decimales.
 */
function calculateWeightedRanking(reviews) {
  if (!reviews || reviews.length === 0) return 0;

  const now = new Date();
  let totalWeight = 0;
  let accumulatedScore = 0;

  for (const rev of reviews) {
    // 1. Antigüedad en días
    const ageInDays = Math.max(0, (now - new Date(rev.fechaCreacion)) / (1000 * 60 * 60 * 24));
    
    // Factor de tiempo: decae suavemente con el tiempo (mínimo 0.3)
    const timeDecayFactor = Math.max(0.3, 1 / (1 + ageInDays * 0.05));

    // 2. Balance de likes / dislikes
    const likesCount = rev.likes ? rev.likes.length : 0;
    const dislikesCount = rev.dislikes ? rev.dislikes.length : 0;
    const voteBalance = likesCount - dislikesCount;
    
    // Impacto de votos: normalizado entre 0.8 y 1.2
    const voteFactor = Math.max(0.8, Math.min(1.2, 1 + voteBalance * 0.05));

    // 3. Peso final de la reseña
    const weight = timeDecayFactor * voteFactor;
    
    accumulatedScore += rev.calificacion * weight;
    totalWeight += weight;
  }

  const finalRanking = totalWeight > 0 ? accumulatedScore / totalWeight : 0;
  return Math.round(finalRanking * 100) / 100;
}

module.exports = { calculateWeightedRanking };