import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { 
  Box, 
  MapPin, 
  Compass, 
  ShieldCheck, 
  Layers, 
  Sparkles, 
  Camera, 
  Trophy, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  RotateCw, 
  Eye, 
  Maximize2, 
  Zap, 
  Cpu, 
  Radio, 
  Info 
} from 'lucide-react';
import { GeoItem, UsinaFatoGeo } from '../types.ts';

export const GeoDigitalTwinTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'MAPA_2D' | 'DIGITAL_TWIN_3D' | 'REALIDADE_AUMENTADA' | 'GAMIFICACAO'>('DIGITAL_TWIN_3D');
  const [geoData, setGeoData] = useState<{ subestacoes_e_cabines: GeoItem[]; usinas_mmgd_amostra: UsinaFatoGeo[] }>({
    subestacoes_e_cabines: [],
    usinas_mmgd_amostra: []
  });
  const [selectedGeoItem, setSelectedGeoItem] = useState<GeoItem | UsinaFatoGeo | null>(null);
  const [layerFilters, setLayerFilters] = useState({
    subestacoes: true,
    cabines: true,
    usinas: true
  });

  // Gamificação State
  const [questStep, setQuestStep] = useState<number>(0);
  const [auditScore, setAuditScore] = useState<number>(0);
  const [questFeedback, setQuestFeedback] = useState<string | null>(null);
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);

  // AR State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [arTargetDetected, setArTargetDetected] = useState<boolean>(true);

  // Three.js 3D Canvas
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [inspectedComponent, setInspectedComponent] = useState<{
    nome: string;
    tag: string;
    tensao: string;
    fabricante: string;
    funcao: string;
    status: string;
  } | null>(null);

  // Busca dados de geolocalização e auditoria
  useEffect(() => {
    fetch('/api/geo/plants-and-substations')
      .then(res => res.json())
      .then(data => {
        setGeoData({
          subestacoes_e_cabines: data.subestacoes_e_cabines || [],
          usinas_mmgd_amostra: data.usinas_mmgd_amostra || []
        });
      })
      .catch(err => console.error('Erro ao carregar dados geo:', err));
  }, []);

  // Three.js Scene Setup para Subestação 138/13.8kV & Cabine Primária
  useEffect(() => {
    if (activeSubTab !== 'DIGITAL_TWIN_3D' || !mountRef.current) return;

    const width = mountRef.current.clientWidth || 800;
    const height = 450;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);
    scene.fog = new THREE.FogExp2(0x090d16, 0.02);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(16, 12, 18);
    camera.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;

    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // Iluminação
    const ambientLight = new THREE.AmbientLight(0x404860, 1.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff5e6, 2.5);
    sunLight.position.set(20, 30, 20);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const blueLight = new THREE.PointLight(0x06b6d4, 3, 25);
    blueLight.position.set(-5, 8, 5);
    scene.add(blueLight);

    // Solo de cascalho da subestação
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Grade de piso (Grid)
    const grid = new THREE.GridHelper(50, 50, 0x06b6d4, 0x334155);
    grid.position.y = 0.02;
    scene.add(grid);

    // 1. Transformador de Potência Tri-fásico a Óleo 138/13.8 kV
    const trafoGroup = new THREE.Group();
    trafoGroup.userData = {
      nome: 'Transformador de Força Principal (TR-01)',
      tag: '138 / 13.8 kV — 25/33 MVA',
      tensao: 'Alta Tensão 138 kV para Média 13.8 kV',
      fabricante: 'WEG Transformadores / ABB',
      funcao: 'Rebaixamento de tensão da linha tronco para distribuição MMGD',
      status: 'Conforme - Temperatura do Óleo: 64°C (Normal)'
    };

    // Tanque principal
    const trafoTanque = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 3.2, 3),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6, roughness: 0.3 })
    );
    trafoTanque.position.y = 1.6;
    trafoTanque.castShadow = true;
    trafoGroup.add(trafoTanque);

    // Radiadores laterais
    for (let i = -1.5; i <= 1.5; i += 0.75) {
      const rad1 = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 2.2, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 })
      );
      rad1.position.set(i, 1.6, 1.8);
      trafoGroup.add(rad1);

      const rad2 = rad1.clone();
      rad2.position.set(i, 1.6, -1.8);
      trafoGroup.add(rad2);
    }

    // Buchas de Alta Tensão (138 kV)
    for (let b = -1.2; b <= 1.2; b += 1.2) {
      const buchaAT = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.22, 1.8, 16),
        new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.2 }) // Porcelana marrom
      );
      buchaAT.position.set(b, 3.8, 0);
      trafoGroup.add(buchaAT);
    }

    trafoGroup.position.set(-4, 0, 0);
    scene.add(trafoGroup);

    // 2. Disjuntor de Alta Tensão a Gás SF6
    const disjuntorGroup = new THREE.Group();
    disjuntorGroup.userData = {
      nome: 'Disjuntor Tripolar SF6 (DJ-138)',
      tag: '145 kV — 3150 A — 40 kA',
      tensao: '138 kV',
      fabricante: 'Siemens Energy 3AP1',
      funcao: 'Interrupção ultrarrápida de correntes de curto-circuito em 3 ciclos',
      status: 'Pressão SF6: 6.2 bar (Seguro / Sem Vazamentos)'
    };

    for (let p = -1.2; p <= 1.2; p += 1.2) {
      const polo = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 2.8, 16),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 })
      );
      polo.position.set(p, 2.6, 0);
      disjuntorGroup.add(polo);

      const basePolo = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 1.2, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x1e293b })
      );
      basePolo.position.set(p, 0.6, 0);
      disjuntorGroup.add(basePolo);
    }

    disjuntorGroup.position.set(3, 0, 0);
    scene.add(disjuntorGroup);

    // 3. Cabine Primária Blindada de Conexão MMGD 13.8 kV
    const cabineGroup = new THREE.Group();
    cabineGroup.userData = {
      nome: 'Cabine Primária Blindada MMGD (CP-01)',
      tag: '13.8 kV / 630 A — Grau de Proteção IP-54',
      tensao: 'Média Tensão 13.8 kV',
      fabricante: 'Schneider Electric / WEG',
      funcao: 'Ponto de Conexão e Medição de Faturamento ANEEL (SMF) com Relé 50/51/27/59',
      status: 'Certificação ANEEL em dia • Relés microprocessados parametrizados'
    };

    const cabineCorpo = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 2.6, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.5, roughness: 0.4 })
    );
    cabineCorpo.position.set(0, 1.3, 0);
    cabineCorpo.castShadow = true;
    cabineGroup.add(cabineCorpo);

    // Visor de inspeção da cabine
    const visor = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7 })
    );
    visor.position.set(0, 1.5, 1.11);
    cabineGroup.add(visor);

    cabineGroup.position.set(0, 0, 6);
    scene.add(cabineGroup);

    // Barramento Aéreo Superior com Isoladores
    const barramento = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 12, 8),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9 })
    );
    barramento.rotation.z = Math.PI / 2;
    barramento.position.set(0, 6, 0);
    scene.add(barramento);

    // Interação de Clique para Inspeção
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects([trafoGroup, disjuntorGroup, cabineGroup], true);

      if (intersects.length > 0) {
        let obj: THREE.Object3D | null = intersects[0].object;
        while (obj && !obj.userData?.nome && obj.parent) {
          obj = obj.parent;
        }
        if (obj?.userData?.nome) {
          setInspectedComponent(obj.userData as any);
        }
      }
    };

    renderer.domElement.addEventListener('click', handleClick);

    // Rotação suave da câmera em órbita
    let angle = 0;
    let isRotating = true;

    renderer.domElement.addEventListener('mousedown', () => { isRotating = false; });
    renderer.domElement.addEventListener('mouseup', () => { isRotating = true; });

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (isRotating) {
        angle += 0.003;
        camera.position.x = Math.sin(angle) * 22;
        camera.position.z = Math.cos(angle) * 22;
        camera.lookAt(0, 2, 2);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Limpeza
    return () => {
      cancelAnimationFrame(animationFrameId);
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.dispose();
      if (mountRef.current) mountRef.current.innerHTML = '';
    };
  }, [activeSubTab]);

  // Função para ligar/desligar câmera no modo AR
  const toggleCamera = async () => {
    if (isCameraActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setIsCameraActive(true);
      } catch (err) {
        console.warn('Câmera não disponível no ambiente de teste, ativando feed simulado AR.');
        setIsCameraActive(true);
      }
    }
  };

  // Gamificação: Resposta a Quests
  const quests = [
    {
      id: 1,
      titulo: 'Missão 1: Detecção de Outlier Regulatória',
      enunciado: 'Um agente cadastrou uma usina solar de 6.850 kW (6.85 MW) na distribuidora como Minigeração Distribuída (MMGD). Sob o Art. 2º da Lei 14.300/2022, este enquadramento é legal?',
      opcoes: [
        { texto: 'Sim, a Lei 14.300 aumentou o teto para 10 MW.', correta: false, feedback: 'Incorreto. O teto legal da minigeração distribuída é de 5.000 kW (5 MW), exceto para CGH e fontes despacháveis com regras específicas.' },
        { texto: 'Não, o limite máximo para MMGD é 5.000 kW (5 MW). O projeto deve ir para Geração Centralizada (GC / SIGA).', correta: true, feedback: 'Correto! Acima de 5.000 kW o projeto é centralizado, exigindo outorga ANEEL e conexão na Rede Básica/ONS.' },
        { texto: 'Depende apenas se for residencial ou industrial.', correta: false, feedback: 'Incorreto. O limite de 5 MW independe da classe de consumo.' }
      ]
    },
    {
      id: 2,
      titulo: 'Missão 2: O Desafio da Rampa do Pato no DESSEM',
      enunciado: 'Às 17:30, a geração solar despenca de 28.000 MW para zero até às 18:30. Qual estratégia operativa o ONS deve programar no modelo DESSEM para evitar afundamento de frequência?',
      opcoes: [
        { texto: 'Desligar as turbinas hidrelétricas para economizar água nos reservatórios.', correta: false, feedback: 'Incorreto. Desligar causaria um colapso imediato por déficit de geração.' },
        { texto: 'Despachar rampa rápida de subida (Ramp-Up) de Usinas Hidrelétricas e Térmicas flexíveis.', correta: true, feedback: 'Excelente! O ONS utiliza a flexibilidade das hidrelétricas com turbinas Francis e termoelétricas de partida rápida.' },
        { texto: 'Aguardar a meia-noite sem intervenção do operador.', correta: false, feedback: 'Incorreto. A inércia do sistema não suporta a perda solar sem compensação ativa.' }
      ]
    },
    {
      id: 3,
      titulo: 'Missão 3: Auditoria do Fio B em 2026',
      enunciado: 'Um sistema solar de 30 kW protocolado em abril de 2024 (enquadrado como GD II) injeta 2.000 kWh na rede em 2026. Qual é a porcentagem da tarifa Fio B devida à concessionária?',
      opcoes: [
        { texto: '0% (Isenção vitalícia de Fio B).', correta: false, feedback: 'Incorreto. Apenas projetos com protocolo até 06/01/2023 (GD I) possuem direito adquirido até 2045.' },
        { texto: '60% do Fio B (Conforme a escala de transição do Art. 27 da Lei 14.300 para o ano de 2026).', correta: true, feedback: 'Exato! Em 2026 a cobrança é de 60% do Fio B, avançando para 75% em 2027 e 100% em 2029.' },
        { texto: '100% com multa regulatória.', correta: false, feedback: 'Incorreto. O escalonamento é gradual ano a ano.' }
      ]
    }
  ];

  const handleAnswerQuest = (option: { texto: string; correta: boolean; feedback: string }) => {
    setQuestFeedback(option.feedback);
    if (option.correta) {
      setAuditScore(prev => prev + 250);
      if (!unlockedBadges.includes('Auditor ANEEL')) {
        setUnlockedBadges(prev => [...prev, 'Auditor ANEEL', 'Perito DESSEM/ONS']);
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Sub-navegação interna */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'DIGITAL_TWIN_3D', label: '🧊 Gêmeo Digital 3D (Subestação & Cabine)', icon: Box },
            { id: 'MAPA_2D', label: '🗺️ Mapa 2D GIS (Usinas, Subestações & Cabines)', icon: MapPin },
            { id: 'REALIDADE_AUMENTADA', label: '📱 Realidade Aumentada (AR Inspector)', icon: Camera },
            { id: 'GAMIFICACAO', label: '🎮 Gamificação Regulatória MEx', icon: Trophy }
          ].map(st => {
            const Icon = st.icon;
            const isActive = activeSubTab === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setActiveSubTab(st.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {st.label}
              </button>
            );
          })}
        </div>

        {/* Resposta direta à pergunta do usuário */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-purple-300 bg-purple-950/40 px-3 py-1 rounded-full border border-purple-800 font-mono">
            Audit Score: <strong>{auditScore} XP</strong>
          </span>
        </div>
      </div>

      {/* 1. VISUALIZAÇÃO GÊMEO DIGITAL 3D (THREE.JS) */}
      {activeSubTab === 'DIGITAL_TWIN_3D' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Box className="w-5 h-5 text-purple-400" />
                Gêmeo Digital 3D: Subestação Rebaixadora 138/13.8 kV & Cabine Primária MMGD
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Modelagem WebGL tridimensional com física de materiais, iluminação e nós de inspeção técnica
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 font-mono">
                <RotateCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                Órbita 360° Ativa (Arraste para girar)
              </span>
            </div>
          </div>

          {/* Canvas 3D */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
            <div ref={mountRef} className="w-full h-[460px] cursor-grab active:cursor-grabbing" />
            
            {/* Controles e Instruções Sobrepostos */}
            <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-slate-700/60 text-xs text-slate-300 max-w-xs space-y-1 pointer-events-none">
              <span className="font-bold text-purple-300 block flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> Componentes Inspecionáveis:
              </span>
              <ul className="text-[11px] text-slate-400 space-y-0.5">
                <li>• <strong>Transformador a Óleo</strong> 138/13.8 kV (Cinza com Buchas)</li>
                <li>• <strong>Disjuntor a Gás SF6</strong> (Pólos verticais de alta tensão)</li>
                <li>• <strong>Cabine Primária MMGD</strong> (Cubículo Azul 13.8 kV)</li>
              </ul>
              <span className="text-[10px] text-cyan-400 font-semibold block pt-1">
                👉 Clique em qualquer equipamento 3D para ver a placa técnica!
              </span>
            </div>

            {/* Modal / Card Flutuante de Inspeção do Componente Clicado */}
            {inspectedComponent && (
              <div className="absolute right-4 top-4 bottom-4 w-80 bg-slate-900/95 backdrop-blur-md border border-cyan-500/40 rounded-xl p-4 shadow-2xl flex flex-col justify-between animate-fadeIn z-20 text-xs">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-white text-sm flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-cyan-400" />
                      {inspectedComponent.nome}
                    </span>
                    <button
                      onClick={() => setInspectedComponent(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="mt-3 space-y-2.5">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Especificação Nominal:</span>
                      <span className="font-mono text-cyan-300 font-bold">{inspectedComponent.tag}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Nível de Tensão:</span>
                      <span className="text-slate-200">{inspectedComponent.tensao}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Fabricante Auditado:</span>
                      <span className="text-slate-200">{inspectedComponent.fabricante}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Função no Sistema:</span>
                      <span className="text-slate-300 leading-snug">{inspectedComponent.funcao}</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                      <span className="font-bold block text-[10px] uppercase font-mono">Telemetria & Diagnóstico:</span>
                      <span className="text-[11px]">{inspectedComponent.status}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono text-center">
                  Gêmeo Digital MEx Energia • Padrão ANEEL/ONS
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* 2. MAPA 2D GIS GEORREFERENCIADO */}
      {activeSubTab === 'MAPA_2D' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-400" />
                Mapa 2D GIS Georreferenciado: Usinas GC, Subestações ONS & Cabines Primárias
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Projeção geográfica do Brasil com dados oficiais auditados de latitude e longitude
              </p>
            </div>

            {/* Filtros de Camadas */}
            <div className="flex items-center gap-2 text-xs">
              <label className="flex items-center gap-1.5 text-cyan-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={layerFilters.subestacoes}
                  onChange={e => setLayerFilters({ ...layerFilters, subestacoes: e.target.checked })}
                  className="rounded text-cyan-500"
                />
                Subestações ONS (500/800kV)
              </label>

              <label className="flex items-center gap-1.5 text-amber-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={layerFilters.cabines}
                  onChange={e => setLayerFilters({ ...layerFilters, cabines: e.target.checked })}
                  className="rounded text-amber-500"
                />
                Cabines Primárias MT
              </label>

              <label className="flex items-center gap-1.5 text-emerald-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={layerFilters.usinas}
                  onChange={e => setLayerFilters({ ...layerFilters, usinas: e.target.checked })}
                  className="rounded text-emerald-500"
                />
                Usinas MMGD & GC
              </label>
            </div>
          </div>

          {/* Canvas SVG Interativo do Mapa do Brasil com Plotagem Real */}
          <div className="relative h-[480px] bg-slate-950 rounded-2xl p-4 border border-slate-800 overflow-hidden flex items-center justify-center">
            
            {/* SVG do contorno aproximado do Brasil */}
            <svg viewBox="-75 -35 45 42" className="w-full h-full max-h-[460px]">
              {/* Contorno simplificado do Brasil em coordenadas geográficas reais */}
              <path
                d="M -70 2 L -60 4 L -52 4 L -47 -1 L -36 -5 L -35 -9 L -38 -18 L -41 -22 L -48 -28 L -53 -33 L -57 -30 L -54 -26 L -58 -22 L -65 -20 L -68 -15 L -73 -9 L -70 2 Z"
                fill="#0f172a"
                stroke="#1e293b"
                strokeWidth="0.4"
              />

              {/* Linhas de transmissão tronco ilustrativas entre SEs */}
              <line x1="-51.78" y1="-3.22" x2="-43.78" y2="-22.86" stroke="#06b6d4" strokeWidth="0.2" strokeDasharray="0.4, 0.4" opacity="0.6" />
              <line x1="-54.58" y1="-25.43" x2="-47.06" y2="-22.90" stroke="#06b6d4" strokeWidth="0.2" strokeDasharray="0.4, 0.4" opacity="0.6" />
              <line x1="-49.64" y1="-3.83" x2="-51.78" y2="-3.22" stroke="#06b6d4" strokeWidth="0.2" opacity="0.6" />

              {/* Plotagem de Subestações e Cabines */}
              {layerFilters.subestacoes && geoData.subestacoes_e_cabines.filter(s => s.tipo.includes('Subestação')).map(se => (
                <g 
                  key={se.id} 
                  className="cursor-pointer group"
                  onClick={() => setSelectedGeoItem(se)}
                >
                  <circle cx={se.lon} cy={se.lat} r="0.8" fill="#8b5cf6" opacity="0.4" className="radar-pulse-animation" />
                  <circle cx={se.lon} cy={se.lat} r="0.45" fill="#a855f7" stroke="#ffffff" strokeWidth="0.1" />
                  <text x={se.lon + 0.6} y={se.lat} fontSize="0.7" fill="#e2e8f0" fontWeight="bold">
                    {se.nome.split(' ')[1]}
                  </text>
                </g>
              ))}

              {layerFilters.cabines && geoData.subestacoes_e_cabines.filter(s => s.tipo.includes('Cabine')).map(cab => (
                <g 
                  key={cab.id} 
                  className="cursor-pointer group"
                  onClick={() => setSelectedGeoItem(cab)}
                >
                  <rect x={cab.lon - 0.3} y={cab.lat - 0.3} width="0.6" height="0.6" fill="#f59e0b" stroke="#ffffff" strokeWidth="0.08" />
                  <text x={cab.lon + 0.5} y={cab.lat} fontSize="0.6" fill="#fcd34d">
                    {cab.municipio}
                  </text>
                </g>
              ))}

              {layerFilters.usinas && geoData.usinas_mmgd_amostra.map(us => (
                <g 
                  key={us.id} 
                  className="cursor-pointer group"
                  onClick={() => setSelectedGeoItem(us)}
                >
                  <circle cx={us.lon} cy={us.lat} r="0.35" fill={us.is_outlier ? '#f43f5e' : '#10b981'} stroke="#ffffff" strokeWidth="0.06" />
                </g>
              ))}
            </svg>

            {/* Dossiê Flutuante do Elemento Selecionado no Mapa */}
            {selectedGeoItem && (
              <div className="absolute bottom-4 left-4 max-w-sm bg-slate-900/95 border border-cyan-500/40 rounded-xl p-4 shadow-2xl text-xs space-y-2 z-20">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="font-bold text-white text-sm">
                    {'nome' in selectedGeoItem ? selectedGeoItem.nome : selectedGeoItem.nom_empreendimento}
                  </span>
                  <button onClick={() => setSelectedGeoItem(null)} className="text-slate-400 hover:text-white">✕</button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Tipo:</span>
                    <span className="text-cyan-300 font-semibold">
                      {'tipo' in selectedGeoItem ? selectedGeoItem.tipo : `${selectedGeoItem.fonte_norm} MMGD`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Local:</span>
                    <span className="text-slate-200">
                      {'municipio' in selectedGeoItem ? selectedGeoItem.municipio : selectedGeoItem.nom_municipio}, {'uf' in selectedGeoItem ? selectedGeoItem.uf : selectedGeoItem.sig_uf}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Latitude / Longitude:</span>
                    <span className="text-slate-300 font-mono">
                      {selectedGeoItem.lat.toFixed(4)}, {selectedGeoItem.lon.toFixed(4)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Capacidade:</span>
                    <span className="text-emerald-400 font-bold font-mono">
                      {'capacidade_mva' in selectedGeoItem ? `${selectedGeoItem.capacidade_mva} MVA` : `${(selectedGeoItem as any).potencia_kw} kW`}
                    </span>
                  </div>
                </div>

                <div className="p-2 bg-slate-950 rounded-lg text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {'status_auditoria' in selectedGeoItem ? selectedGeoItem.status_auditoria : 'Auditado - Marco Lei 14.300'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. SIMULADOR DE REALIDADE AUMENTADA (AR INSPECTOR) */}
      {activeSubTab === 'REALIDADE_AUMENTADA' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-purple-400" />
                MEx AR Inspector (Realidade Aumentada para Cabines & Subestações)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Projeção de HUD tático de campo com reconhecimento de componentes e telemetria ANEEL
              </p>
            </div>

            <button
              onClick={toggleCamera}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                isCameraActive
                  ? 'bg-rose-500 hover:bg-rose-600 text-white'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30'
              }`}
            >
              <Camera className="w-4 h-4" />
              {isCameraActive ? 'Parar Câmera AR' : 'Ativar Câmera AR de Inspeção'}
            </button>
          </div>

          {/* Viewport de Realidade Aumentada */}
          <div className="relative h-[480px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
            
            {/* Feed de Vídeo ou Feed Simulado de Alta Fidelidade */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
            />

            {!isCameraActive && (
              <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-purple-400">
                  <Camera className="w-10 h-10 animate-pulse" />
                </div>
                <h4 className="text-base font-bold text-white">Simulador de Realidade Aumentada (AR Viewport)</h4>
                <p className="text-xs text-slate-400 max-w-md">
                  Clique no botão <strong>"Ativar Câmera AR de Inspeção"</strong> acima para projetar o HUD em tempo real sobre seu ambiente ou testar os sensores de visão computacional em cabines primárias.
                </p>
              </div>
            )}

            {/* HUD de Realidade Aumentada (Sempre ativo quando em teste) */}
            <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
              
              {/* Barra de Status AR Superior */}
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-purple-500/40 text-purple-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  AR TRACKING: 6-DOF LOCK
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700 text-slate-300">
                  LAT: -17.3488 | LON: -44.9351 | ELEV: 512m
                </span>
              </div>

              {/* Bounding Box Holográfica de Reconhecimento */}
              <div className="self-center w-72 h-72 border-2 border-dashed border-cyan-400 rounded-2xl relative flex flex-col justify-between p-3 bg-cyan-500/5 animate-pulse">
                <div className="flex items-center justify-between text-[10px] font-mono text-cyan-300">
                  <span>DISJUNTOR A VÁCUO 13.8kV</span>
                  <span className="text-emerald-400">99.2% DETECTADO</span>
                </div>
                <div className="text-center text-xs font-mono text-slate-300">
                  <span>[ PONTO DE MEDIÇÃO ANEEL SMF ]</span>
                  <div className="text-[10px] text-amber-400 mt-1">SELO INMETRO: CONFORME</div>
                </div>
                <div className="text-[10px] font-mono text-slate-400 flex justify-between">
                  <span>CORRENTE: 384 A</span>
                  <span className="text-emerald-400">TEMP: 42°C OK</span>
                </div>
              </div>

              {/* Rodapé do HUD */}
              <div className="flex items-center justify-between text-[11px] text-slate-300 bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-slate-700">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Inspeção em conformidade com o <strong>Módulo 3 dos Procedimentos de Distribuição (PRODIST / ANEEL)</strong></span>
                </div>
                <span className="text-cyan-400 font-mono">CALIBRAÇÃO ATIVA</span>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 4. GAMIFICAÇÃO REGULATÓRIA MEx */}
      {activeSubTab === 'GAMIFICACAO' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                Gamificação Regulatória: Energy Audit Quest
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Desafios práticos de auditoria de dados, limites de potência, transição Lei 14.300 e balanceamento do SIN
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-amber-400 font-mono font-bold bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/30">
                Score: {auditScore} XP
              </span>
            </div>
          </div>

          {/* Badges Conquistadas */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-semibold">Distintivos Desbloqueados:</span>
            {unlockedBadges.length > 0 ? (
              unlockedBadges.map((badge, bIdx) => (
                <span key={bIdx} className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 font-mono">
                  🎖️ {badge}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500 italic">Complete os desafios abaixo para desbloquear distintivos.</span>
            )}
          </div>

          {/* Card da Quest Atual */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-purple-400 uppercase">
                {quests[questStep].titulo}
              </span>
              <span className="text-xs text-slate-400">
                Quest {questStep + 1} de {quests.length}
              </span>
            </div>

            <h4 className="text-sm font-bold text-white leading-relaxed">
              {quests[questStep].enunciado}
            </h4>

            {/* Opções de Resposta */}
            <div className="space-y-2 pt-2">
              {quests[questStep].opcoes.map((opt, oIdx) => (
                <button
                  key={oIdx}
                  onClick={() => handleAnswerQuest(opt)}
                  className="w-full text-left p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500 text-xs text-slate-200 transition cursor-pointer flex items-start gap-2.5"
                >
                  <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-mono text-cyan-400 shrink-0 mt-0.5">
                    {String.fromCharCode(65 + oIdx)}
                  </span>
                  <span>{opt.texto}</span>
                </button>
              ))}
            </div>

            {/* Feedback da Resposta */}
            {questFeedback && (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-cyan-300 animate-fadeIn">
                <strong>Análise Técnica:</strong> {questFeedback}
              </div>
            )}

            {/* Navegação entre Quests */}
            <div className="flex justify-between pt-3 border-t border-slate-800">
              <button
                disabled={questStep === 0}
                onClick={() => { setQuestStep(prev => prev - 1); setQuestFeedback(null); }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs disabled:opacity-30 cursor-pointer"
              >
                Anterior
              </button>
              <button
                disabled={questStep === quests.length - 1}
                onClick={() => { setQuestStep(prev => prev + 1); setQuestFeedback(null); }}
                className="px-4 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs disabled:opacity-30 cursor-pointer"
              >
                Próxima Missão
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
