document.addEventListener('DOMContentLoaded', function () {
    if (typeof patientDataForAI === 'undefined') {
        console.error("patientDataForAI not available. AI recommendations cannot be fetched.");
        return;
    }

    const overviewText = document.getElementById('overviewText');
    const riskList = document.getElementById('riskList');
    const precautionList = document.getElementById('precautionList');
    const refreshButton = document.getElementById('refreshRecommendations');
    const recommendationsAside = document.querySelector('aside.recommendations');

    function showLoading() {
        if (overviewText) overviewText.innerHTML = '<span class="loading-spinner">Generating summary...</span>';
        if (riskList) riskList.innerHTML = '<li><span class="loading-spinner">Analyzing risks...</span></li>';
        if (precautionList) precautionList.innerHTML = '<li><span class="loading-spinner">Generating precautions...</span></li>';
        if (refreshButton) {
            refreshButton.style.pointerEvents = 'none';
            refreshButton.classList.add('loading');
        }
        if (recommendationsAside) {
            recommendationsAside.classList.add('is-loading');
        }
    }

    function hideLoading() {
        if (refreshButton) {
            refreshButton.style.pointerEvents = 'auto';
            refreshButton.classList.remove('loading');
        }
        if (recommendationsAside) {
            recommendationsAside.classList.remove('is-loading');
        }
    }

    // Parse JSON robustly, even if wrapped in code fences, smart quotes, or returned as a JSON-encoded string.
    function parseJsonSafe(raw) {
        if (!raw) return null;
        let text = raw.trim();

        // Aggressively strip markdown code blocks
        // Remove ```json or ``` at start/end, and any remaining backticks
        text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
        
        // If the result still has backticks, remove them all
        if (text.includes('```')) {
            text = text.replace(/```/g, '').trim();
        }

        // If extra prose surrounds JSON, extract the first {...} block.
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
            text = text.slice(firstBrace, lastBrace + 1);
        }

        const smartToStraight = (s) => s.replace(/[\u201c\u201d]/g, '"').replace(/[\u2018\u2019]/g, "'");
        const cleaned = smartToStraight(text);
        const candidates = [text, cleaned];

        for (const candidate of candidates) {
            try {
                const parsed = JSON.parse(candidate);
                if (typeof parsed === 'string') {
                    // Sometimes the API returns a JSON string containing JSON.
                    try {
                        const nested = JSON.parse(parsed);
                        return nested;
                    } catch (_) {
                        return { overview: parsed };
                    }
                }
                return parsed;
            } catch (_) {
                continue;
            }
        }

        console.error('Failed to parse JSON from AI response. Raw:', raw.substring(0, 200));
        return null;
    }

    async function fetchAIRecommendations() {
        showLoading();

        try {
            const response = await fetch('generate_recommendations.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(patientDataForAI)
            });

            if (!response.ok) {
                if (response.status === 429) {
                    if (overviewText) overviewText.textContent = 'Rate limit exceeded. Please wait and try again.';
                    if (riskList) riskList.innerHTML = '<li>Rate limit exceeded. Please wait and try again.</li>';
                    if (precautionList) precautionList.innerHTML = '<li>Rate limit exceeded. Please wait and try again.</li>';
                    hideLoading();
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const raw = await response.text();
            console.log('Raw AI response:', raw);
            let data = parseJsonSafe(raw);
            console.log('Parsed data:', data);

            // If the AI returned a string blob, try to coerce it into structured data
            if (typeof data === 'string') {
                const again = parseJsonSafe(data);
                data = again || { overview: data };
            }

            if (!data || typeof data !== 'object') {
                console.error('Invalid data structure. Raw:', raw, 'Parsed:', data);
                throw new Error('Invalid JSON returned from AI');
            }

            if (data.error) {
                console.error("AI Recommendation Error:", data.error, data.details || '');
                if (overviewText) overviewText.textContent = `Error generating summary: ${data.error}`;
                if (riskList) riskList.innerHTML = `<li>Error generating risks: ${data.error}</li>`;
                if (precautionList) precautionList.innerHTML = `<li>Error generating precautions: ${data.error}</li>`;
                return;
            }

            if (overviewText) {
                overviewText.textContent = data.overview;
            }

            const risks = Array.isArray(data.health_risks) ? data.health_risks : (Array.isArray(data.risks) ? data.risks : []);
            const recs = Array.isArray(data.precautionary_measures) ? data.precautionary_measures : (Array.isArray(data.recommendations) ? data.recommendations : []);

            if (riskList) {
                riskList.innerHTML = '';
                if (risks.length > 0) {
                    risks.forEach((risk) => {
                        const title = typeof risk === 'string' ? risk : (risk.title || 'Risk');
                        const desc = typeof risk === 'string' ? '' : (risk.description || '');
                        const listItem = document.createElement('li');
                        listItem.innerHTML = `
                            <i class="material-symbols-outlined error">error</i>
                            <div>
                                <h4>${title}</h4>
                                ${desc ? `<p>${desc}</p>` : ''}
                            </div>
                        `;
                        riskList.appendChild(listItem);
                    });
                } else {
                    riskList.innerHTML = '<li>No specific health risks identified based on current data.</li>';
                }
            }

            if (precautionList) {
                precautionList.innerHTML = '';
                if (recs.length > 0) {
                    recs.forEach((precaution) => {
                        const title = typeof precaution === 'string' ? precaution : (precaution.title || 'Recommendation');
                        const desc = typeof precaution === 'string' ? '' : (precaution.description || '');
                        const listItem = document.createElement('li');
                        listItem.innerHTML = `
                            <i class="material-symbols-outlined">spa</i>
                            <div>
                                <h4>${title}</h4>
                                ${desc ? `<p>${desc}</p>` : ''}
                            </div>
                        `;
                        precautionList.appendChild(listItem);
                    });
                } else {
                    precautionList.innerHTML = '<li>No specific precautionary measures suggested based on current data.</li>';
                }
            }

        } catch (error) {
            console.error("Failed to fetch AI recommendations:", error);
            if (overviewText) overviewText.textContent = 'Failed to load recommendations. Please try again.';
            if (riskList) riskList.innerHTML = '<li>Failed to load risks.</li>';
            if (precautionList) precautionList.innerHTML = '<li>Failed to load precautions.</li>';
        } finally {
            hideLoading();
        }
    }

    if (refreshButton) {
        refreshButton.addEventListener('click', fetchAIRecommendations);
    }

    fetchAIRecommendations();

    const style = document.createElement('style');
    style.innerHTML = `
        .loading-spinner {
            display: inline-block;
            font-style: italic;
            color: var(--text-secondary);
            font-size: 0.95rem;
            animation: pulse-opacity 1.5s infinite ease-in-out;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 20;
            background: none;
            padding: 0.5em 1em;
            border-radius: 8px;
            box-shadow: none;
        }
        .loading-spinner::after {
            content: '';
        }

        /* Pulse opacity animation */
        @keyframes pulse-opacity {
            0% { opacity: 0.5; }
            50% { opacity: 1; }
            100% { opacity: 0.5; }
        }

        /* Spinning refresh icon */
        .refresh-ai {
            cursor: pointer;
            transition: transform 0.5s ease-in-out;
        }
        .refresh-ai.loading {
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .recommendations.is-loading {
            position: relative;
            pointer-events: none;
        }

        .recommendations.is-loading::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(39, 35, 58, 0.7);
            backdrop-filter: blur(3px);
            z-index: 10;
            border-radius: 15px;
        }

        .recommendations.is-loading .loading-spinner {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 11;
            font-size: 1.2rem;
            font-weight: 600;
            color: var(--accent-pink);
            text-align: center;
            width: 100%;
            padding: 0 20px;
            box-sizing: border-box;
        }

        .recommendations.is-loading .recommendation-card h3,
        .recommendations.is-loading .recommendation-card p,
        .recommendations.is-loading .recommendation-card ul {
            opacity: 0.3;
            transition: opacity 0.5s ease;
        }

        .recommendations.is-loading .loading-spinner {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);
});
