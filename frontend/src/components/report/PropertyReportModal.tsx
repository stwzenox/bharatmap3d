import React, { useState } from 'react';
import { Printer, X, Languages, Check } from 'lucide-react';
import { useCadastralStore } from '../../state/useCadastralStore';
import { ORIGIN_LAT, ORIGIN_LNG } from '../../utils/coordinates';
import { ScannableQRCode } from '../common/ScannableQRCode';
const vLogoImg = '/vlogo.jpg';

export const PropertyReportModal: React.FC = () => {
  const { isReportModalOpen, setReportModalOpen, selectedProperty, buildings } = useCadastralStore();
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  if (!isReportModalOpen) return null;

  const prop = selectedProperty || {
    id: 'B001',
    ulpin: 'UP2110B0101P01',
    type: 'Residential (Apartment)',
    building_id: 'B001',
    floor_id: 'B001-F03',
    parcel_id: '12345678901234',
    survey_number: '123/4',
    floor_number: 3,
    z_min: 106.0,
    z_max: 109.0,
    area: 90.25,
    volume: 361.0,
    owner: 'Govt Verified Citizen',
    status: 'Verified Cadastral Record',
  };

  const matchedBuilding = buildings.find(
    (b) => b.building_id?.toUpperCase() === (prop.building_id || 'B001').toUpperCase()
  );

  const bldgFloorsCount = matchedBuilding?.floor_count || prop.floor_count || 12;
  const bldgHeight = (matchedBuilding?.height || prop.height || 42.6).toFixed(1);
  const activeUlpin = prop.ulpin || 'UP2110B0101P01';
  const propertyId = prop.id || prop.building_id || 'B001';
  const parcelUlpin = prop.parcel_id || '12345678901234';
  const propertyType = prop.property_type || prop.building_type || 'Residential (Apartment)';
  const surveyNo = prop.survey_number || '123/4';
  const zMin = prop.z_min ?? 106.0;
  const zMax = prop.z_max ?? 109.0;
  const unitArea = prop.area ?? 90.25;
  const unitVolume = prop.volume ?? 361;

  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://bhu-aadhaar.up.gov.in';
  const qrUrlPayload = `${appOrigin}/?ulpin=${encodeURIComponent(activeUlpin)}&id=${encodeURIComponent(propertyId)}#verify-cadastre`;

  const handlePrint = () => {
    window.print();
  };

  const t = {
    en: {
      docTitle: 'CADASTRAL PROPERTY CERTIFICATE PREVIEW',
      printBtn: 'Print Certificate',
      govtName: 'GOVERNMENT OF UTTAR PRADESH',
      deptName: 'Revenue & Cadastral Mapping Department',
      deptNameHi: 'राजस्व एवं कादस्ट्रल मानचित्रण विभाग',
      docNoLabel: 'Document No.',
      docNoVal: 'UP/R&CMD/3DULPIN/2026/001234',
      issueDateLabel: 'Issue Date:',
      issueDateVal: '22 Sep 2026',
      certTitle: '3D VERTICAL PROPERTY CADASTRAL CERTIFICATE',
      certSubtitle: 'ULPIN VERIFICATION RECORD',
      certTagline: 'Unique Land Parcel Identification Number (ULPIN) for Vertical Property',
      ulpinHeader: '3D ULPIN (14-DIGIT)',
      propId: 'Property ID',
      parcelUlpin: 'Parcel ULPIN',
      propType: 'Property Type',
      propTypeVal: propertyType,
      addressLabel: 'Address',
      addressVal: 'Sector 10, Noida, Gautam Buddha Nagar, Uttar Pradesh, India',
      scanToVerify: 'Scan to Verify\n(ULPIN Record)',
      sec1: '1   PROPERTY IDENTIFICATION',
      landUse: 'Land Use Category',
      landUseVal: 'Residential',
      sec2: '2   SPATIAL & VOLUMETRIC INFORMATION',
      lat: 'Latitude',
      latVal: `${ORIGIN_LAT || '28.5355'}° N`,
      lng: 'Longitude',
      lngVal: `${ORIGIN_LNG || '77.3910'}° E`,
      zBounds: 'Vertical Bounds (Z)',
      zBoundsVal: `${zMin} m to ${zMax} m MSL`,
      volume: 'Calculated Volume',
      volumeVal: `${unitVolume} m³`,
      floorArea: 'Floor Area (This Unit)',
      floorAreaVal: `${unitArea} m²`,
      numFloors: 'Number of Floors (Building)',
      numFloorsVal: String(bldgFloorsCount),
      bldgHeight: 'Building Height',
      bldgHeightVal: `${bldgHeight} m`,
      floorLevel: 'Floor Level (This Unit)',
      floorLevelVal: `3rd Floor (${zMin}–${zMax} m)`,
      crs: 'Coordinate Reference System',
      crsVal: 'WGS 84 / UTM Zone 43N',
      sec3: '3   ADMINISTRATIVE INFORMATION',
      district: 'District',
      districtVal: 'Gautam Buddha Nagar',
      tehsil: 'Tehsil',
      tehsilVal: 'Noida',
      villageWard: 'Village / Ward',
      villageWardVal: 'Sector 10',
      municipality: 'Municipality',
      municipalityVal: 'Noida Authority',
      surveyPlot: 'Survey / Plot No.',
      surveyPlotVal: surveyNo,
      khata: 'Khata No.',
      khataVal: 'N/A',
      sec4: '4   VERIFICATION & DATA SOURCES',
      dataSources: 'Data Sources',
      dataSourcesVal: 'BhuNaksha, ISRO Bhuvan, Municipal GIS, Building Plan Records',
      verStatus: 'Verification Status',
      verStatusVal: 'Verified',
      verDate: 'Verification Date',
      verDateVal: '20 Sep 2026',
      verBy: 'Verified By',
      verByVal: 'Revenue & Cadastral Mapping Department',
      remarks: 'Remarks',
      remarksVal: '3D ULPIN verified for vertical property unit based on integrated cadastral, geospatial and building data.',
      authOfficer: 'Authorized Officer',
      authDept: 'Revenue & Cadastral Mapping Department',
      authGovt: 'Government of Uttar Pradesh',
      disclaimer: 'DIGITAL RECORD • DEMONSTRATION PROTOTYPE • NOT A GOVERNMENT DOCUMENT'
    },
    hi: {
      docTitle: 'कादस्ट्रल संपत्ति प्रमाणपत्र पूर्वावलोकन',
      printBtn: 'प्रमाणपत्र प्रिंट करें',
      govtName: 'उत्तर प्रदेश सरकार',
      deptName: 'राजस्व एवं कादस्ट्रल मानचित्रण विभाग',
      deptNameHi: 'GOVERNMENT OF UTTAR PRADESH',
      docNoLabel: 'दस्तावेज़ संख्या',
      docNoVal: 'UP/R&CMD/3DULPIN/2026/001234',
      issueDateLabel: 'जारी करने की तिथि:',
      issueDateVal: '22 सितंबर 2026',
      certTitle: '3D ऊर्ध्वाधर संपत्ति कादस्ट्रल प्रमाणपत्र',
      certSubtitle: 'ULPIN सत्यापन अभिलेख',
      certTagline: 'ऊर्ध्वाधर संपत्ति के लिए विशिष्ट भूखंड पहचान संख्या (ULPIN)',
      ulpinHeader: '3D ULPIN (14-अंक)',
      propId: 'संपत्ति आईडी',
      parcelUlpin: 'भूखंड ULPIN',
      propType: 'संपत्ति का प्रकार',
      propTypeVal: 'आवासीय (अपार्टमेंट)',
      addressLabel: 'पता',
      addressVal: 'सेक्टर 10, नोएडा, गौतम बुद्ध नगर, उत्तर प्रदेश, भारत',
      scanToVerify: 'सत्यापन हेतु स्कैन करें\n(ULPIN अभिलेख)',
      sec1: '1   संपत्ति पहचान',
      landUse: 'भूमि उपयोग श्रेणी',
      landUseVal: 'आवासीय',
      sec2: '2   स्थानिक एवं आयामीय जानकारी',
      lat: 'अक्षांश',
      latVal: `${ORIGIN_LAT || '28.5355'}° उत्तर`,
      lng: 'देशांतर',
      lngVal: `${ORIGIN_LNG || '77.3910'}° पूर्व`,
      zBounds: 'ऊर्ध्वाधर सीमा (Z)',
      zBoundsVal: `${zMin} मी. से ${zMax} मी. समुद्र तल से`,
      volume: 'अनुमानित आयतन',
      volumeVal: `${unitVolume} घन मीटर`,
      floorArea: 'इकाई क्षेत्रफल',
      floorAreaVal: `${unitArea} वर्ग मीटर`,
      numFloors: 'कुल मंजिलें (भवन)',
      numFloorsVal: String(bldgFloorsCount),
      bldgHeight: 'भवन की ऊंचाई',
      bldgHeightVal: `${bldgHeight} मीटर`,
      floorLevel: 'मंजिल स्तर (इकाई)',
      floorLevelVal: `तीसरी मंजिल (${zMin}–${zMax} मी.)`,
      crs: 'निर्देशांक संदर्भ प्रणाली',
      crsVal: 'WGS 84 / UTM जोन 43N',
      sec3: '3   प्रशासनिक जानकारी',
      district: 'जनपद / जिला',
      districtVal: 'गौतम बुद्ध नगर',
      tehsil: 'तहसील',
      tehsilVal: 'नोएडा',
      villageWard: 'ग्राम / वार्ड',
      villageWardVal: 'सेक्टर 10',
      municipality: 'नगर पालिका / प्राधिकरण',
      municipalityVal: 'नोएडा प्राधिकरण',
      surveyPlot: 'सर्वेक्षण / भूखंड सं.',
      surveyPlotVal: surveyNo,
      khata: 'खाता सं.',
      khataVal: 'लागू नहीं',
      sec4: '4   सत्यापन एवं डेटा स्रोत',
      dataSources: 'डेटा स्रोत',
      dataSourcesVal: 'भू-नक्शा, इसरो भुवन, नगर पालिका जीआईएस, भवन मानचित्र अभिलेख',
      verStatus: 'सत्यापन स्थिति',
      verStatusVal: 'सत्यापित (Verified)',
      verDate: 'सत्यापन तिथि',
      verDateVal: '20 सितंबर 2026',
      verBy: 'सत्यापनकर्ता',
      verByVal: 'राजस्व एवं कादस्ट्रल मानचित्रण विभाग',
      remarks: 'टिप्पणी',
      remarksVal: 'एकीकृत कादस्ट्रल, भू-स्थानिक एवं भवन डेटा के आधार पर 3D ULPIN ऊर्ध्वाधर संपत्ति इकाई विधिवत सत्यापित।',
      authOfficer: 'प्राधिकृत अधिकारी',
      authDept: 'राजस्व एवं कादस्ट्रल मानचित्रण विभाग',
      authGovt: 'उत्तर प्रदेश सरकार',
      disclaimer: 'डिजिटल अभिलेख • प्रदर्शन प्रारूप • यह कोई विधिक सरकारी दस्तावेज नहीं है'
    }
  }[language];

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 print:p-0 print:m-0 print:bg-white print:static print:block animate-fade-in select-none">
      {/* Container Card */}
      <div className="bg-[#0b1220] print:bg-white text-slate-100 print:text-black border border-slate-700/80 print:border-none rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[96vh] print:max-h-none print:w-full print:shadow-none print:overflow-visible print:block overflow-hidden">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="p-3.5 sm:px-6 border-b border-slate-800 bg-[#0f172a] print:hidden flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-blue-400">
            <span className="font-bold text-xs uppercase tracking-wider text-white">
              {t.docTitle}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Language Switcher Pill */}
            <div className="bg-slate-800/90 border border-slate-700 p-0.5 rounded-xl flex items-center shadow-inner">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  language === 'en'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>English</span>
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  language === 'hi'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>हिन्दी</span>
              </button>
            </div>

            {/* Print Certificate Button */}
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/30 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t.printBtn}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={() => setReportModalOpen(false)}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Viewport Wrapper */}
        <div className="overflow-y-auto p-3 sm:p-6 print:p-0 print:m-0 print:overflow-visible bg-[#090d16] print:bg-white flex justify-center print:block">
          {/* Exact Certificate Canvas (Matching 2nd uploaded image) */}
          <div
            id="printable-cadastral-certificate"
            className="w-full max-w-[760px] bg-white text-slate-900 shadow-2xl print:shadow-none print:w-full print:max-w-none border-2 border-slate-900 p-1 font-serif print:m-0 print:border-2"
          >
            <div className="border border-slate-800 p-4 sm:p-5 relative bg-white min-h-[960px] print:min-h-0 print:p-4 flex flex-col justify-between">
              {/* Official vlogo.jpg Watermark in Center Background */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06] select-none z-0">
                <img
                  src={vLogoImg || "/vlogo.jpg"}
                  alt="Government of India Watermark"
                  className="w-[300px] sm:w-[340px] max-w-[50%] h-auto object-contain filter grayscale"
                />
              </div>

              {/* Certificate Inner Content (Z-10 over watermark) */}
              <div className="relative z-10 space-y-3.5">
                {/* 1. Header: Emblem, Department & Document Issue Metadata */}
                <div className="flex items-start justify-between pb-2 border-b border-slate-400/90 gap-2">
                  <div className="flex items-center gap-3">
                    {/* Official State Emblem of India (vlogo.jpg) */}
                    <div className="w-12 h-16 shrink-0 flex items-center justify-center">
                      <img
                        src={vLogoImg || "/vlogo.jpg"}
                        alt="State Emblem of India"
                        className="h-full w-auto object-contain"
                      />
                    </div>

                    <div className="leading-tight text-left">
                      <h2 className="text-xs sm:text-sm font-bold tracking-tight text-slate-900 uppercase">
                        {t.govtName}
                      </h2>
                      <p className="text-[11px] text-slate-700 font-sans font-medium">
                        {t.deptName}
                      </p>
                      <p className="text-[10px] text-slate-600 font-sans">
                        {t.deptNameHi}
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-[10px] font-sans text-slate-700 leading-tight">
                    <div><span className="font-semibold">{t.docNoLabel}</span></div>
                    <div className="font-mono font-semibold text-slate-900">{t.docNoVal}</div>
                    <div className="mt-0.5">{t.issueDateLabel} <span className="font-medium">{t.issueDateVal}</span></div>
                  </div>
                </div>

                {/* 2. Main Title Block */}
                <div className="text-center space-y-0.5 pt-0.5">
                  <h1 className="text-base sm:text-lg font-bold text-[#1e3a5f] tracking-tight uppercase">
                    {t.certTitle}
                  </h1>
                  <h2 className="text-[11px] font-bold tracking-wider text-slate-800 uppercase font-sans">
                    {t.certSubtitle}
                  </h2>
                  <p className="text-[10px] text-slate-500 italic font-sans">
                    {t.certTagline}
                  </p>
                </div>

                {/* 3. Top ULPIN & QR Details Box (Light Blue Card) */}
                <div className="bg-[#f0f4f9] border border-blue-200/90 rounded p-3 flex items-center justify-between gap-4 font-sans text-xs">
                  <div className="space-y-1 text-left flex-1 min-w-0">
                    <div className="text-[9px] uppercase font-bold text-slate-600 tracking-wider">
                      {t.ulpinHeader}
                    </div>
                    <div className="text-lg sm:text-xl font-black text-[#1e3a5f] font-mono tracking-wide">
                      {activeUlpin}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-0.5 text-[11px] text-slate-800 pt-0.5">
                      <div className="sm:col-span-3 text-slate-500 font-medium">{t.propId}</div>
                      <div className="sm:col-span-9 font-bold font-mono">: {propertyId}</div>

                      <div className="sm:col-span-3 text-slate-500 font-medium">{t.parcelUlpin}</div>
                      <div className="sm:col-span-9 font-mono">: {parcelUlpin}</div>

                      <div className="sm:col-span-3 text-slate-500 font-medium">{t.propType}</div>
                      <div className="sm:col-span-9 font-semibold">: {t.propTypeVal}</div>

                      <div className="sm:col-span-3 text-slate-500 font-medium">{t.addressLabel}</div>
                      <div className="sm:col-span-9 leading-tight">: {t.addressVal}</div>
                    </div>
                  </div>

                  {/* QR Code and verification hint */}
                  <div className="shrink-0 flex flex-col items-center justify-center pl-2 border-l border-blue-200/60">
                    <div className="p-1 bg-white border border-slate-300 rounded shadow-xs">
                      <ScannableQRCode
                        value={qrUrlPayload}
                        size={84}
                        showScanHint={false}
                      />
                    </div>
                    <span className="text-[8px] text-slate-600 text-center font-sans mt-1 leading-tight whitespace-pre-line">
                      {t.scanToVerify}
                    </span>
                  </div>
                </div>

                {/* 4. Section 1: PROPERTY IDENTIFICATION */}
                <div className="border border-slate-300 rounded-sm overflow-hidden font-sans text-[11px]">
                  <div className="bg-[#1e3a5f] text-white font-bold text-[10px] uppercase px-2.5 py-1 tracking-wider">
                    {t.sec1}
                  </div>
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="w-[18%] py-1 px-2 text-slate-500 font-medium bg-slate-50/70 border-r border-slate-200">3D ULPIN</td>
                        <td className="w-[32%] py-1 px-2 font-mono font-bold text-slate-900 border-r border-slate-200">{activeUlpin}</td>
                        <td className="w-[18%] py-1 px-2 text-slate-500 font-medium bg-slate-50/70 border-r border-slate-200">{t.propId}</td>
                        <td className="w-[32%] py-1 px-2 font-mono font-bold text-slate-900">{propertyId}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="py-1 px-2 text-slate-500 font-medium bg-slate-50/70 border-r border-slate-200">{t.parcelUlpin}</td>
                        <td className="py-1 px-2 font-mono text-slate-900 border-r border-slate-200">{parcelUlpin}</td>
                        <td className="py-1 px-2 text-slate-500 font-medium bg-slate-50/70 border-r border-slate-200">{t.propType}</td>
                        <td className="py-1 px-2 text-slate-900 font-semibold">{t.propTypeVal}</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2 text-slate-500 font-medium bg-slate-50/70 border-r border-slate-200">{t.addressLabel}</td>
                        <td className="py-1 px-2 text-slate-800 leading-tight border-r border-slate-200">{t.addressVal}</td>
                        <td className="py-1 px-2 text-slate-500 font-medium bg-slate-50/70 border-r border-slate-200">{t.landUse}</td>
                        <td className="py-1 px-2 text-slate-800 font-semibold">{t.landUseVal}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 5. Section 2: SPATIAL & VOLUMETRIC INFORMATION */}
                <div className="border border-slate-300 rounded-sm overflow-hidden font-sans text-[11px]">
                  <div className="bg-[#1e3a5f] text-white font-bold text-[10px] uppercase px-2.5 py-1 tracking-wider">
                    {t.sec2}
                  </div>
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="w-[20%] py-1 px-2 text-slate-500 font-medium bg-slate-50/70 border-r border-slate-200">{t.lat}</td>
                        <td className="w-[30%] py-1 px-2 font-mono text-slate-900 border-r border-slate-200">{t.latVal}</td>
                        <td className="w-[20%] py-1 px-2 text-slate-500 font-medium bg-slate-50/70 border-r border-slate-200">{t.lng}</td>
                        <td className="w-[30%] py-1 px-2 font-mono text-slate-900">{t.lngVal}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="py-1 px-2 text-slate-500 font-medium bg-slate-50/70 border-r border-slate-200">{t.zBounds}</td>
                        <td className="py-1 px-2 font-mono text-slate-900 border-r border-slate-200">{t.zBoundsVal}</td>
                        <td className="py-1 px-2 text-slate-500 font-medium bg-slate-50/70 border-r border-slate-200">{t.volume}</td>
                        <td className="py-1 px-2 font-mono font-bold text-slate-900">{t.volumeVal}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="py-1 px-2 text-slate-500 font-medium bg-slate-50/70 border-r border-slate-200">{t.floorArea}</td>
                        <td className="py-1 px-2 font-mono text-slate-900 border-r border-slate-200">{t.floorAreaVal}</td>
                        <td className="py-1 px-2 text-slate-500 font-medium bg-slate-50/70 border-r border-slate-200">{t.numFloors}</td>
                        <td className="py-1 px-2 font-mono text-slate-900">{t.numFloorsVal}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="py-1 px-2 text-slate-500 font-medium bg-slate-50/70 border-r border-slate-200">{t.bldgHeight}</td>
                        <td className="py-1 px-2 font-mono text-slate-900 border-r border-slate-200">{t.bldgHeightVal}</td>
                        <td className="py-1 px-2 text-slate-500 font-medium bg-slate-50/70 border-r border-slate-200">{t.floorLevel}</td>
                        <td className="py-1 px-2 text-slate-900 font-semibold">{t.floorLevelVal}</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2 text-slate-500 font-medium bg-slate-50/70 border-r border-slate-200">{t.crs}</td>
                        <td colSpan={3} className="py-1 px-2 font-mono text-slate-900">{t.crsVal}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 6. Section 3: ADMINISTRATIVE INFORMATION */}
                <div className="border border-slate-300 rounded-sm overflow-hidden font-sans text-[11px]">
                  <div className="bg-[#1e3a5f] text-white font-bold text-[10px] uppercase px-2.5 py-1 tracking-wider">
                    {t.sec3}
                  </div>
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="w-[20%] py-1 px-2 text-slate-500 font-medium bg-slate-50/70 border-r border-slate-200">{t.district}</td>
                        <td className="w-[30%] py-1 px-2 text-slate-900 font-semibold border-r border-slate-200">{t.districtVal}</td>
                        <td className="w-[20%] py-1 px-2 text-slate-500 font-medium bg-slate-50/70 border-r border-slate-200">{t.tehsil}</td>
                        <td className="w-[30%] py-1 px-2 text-slate-900 font-semibold">{t.tehsilVal}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="py-1 px-2 text-slate-500 font-medium bg-slate-50/70 border-r border-slate-200">{t.villageWard}</td>
                        <td className="py-1 px-2 text-slate-900 border-r border-slate-200">{t.villageWardVal}</td>
                        <td className="py-1 px-2 text-slate-500 font-medium bg-slate-50/70 border-r border-slate-200">{t.municipality}</td>
                        <td className="py-1 px-2 text-slate-900">{t.municipalityVal}</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2 text-slate-500 font-medium bg-slate-50/70 border-r border-slate-200">{t.surveyPlot}</td>
                        <td className="py-1 px-2 font-mono text-slate-900 border-r border-slate-200">{t.surveyPlotVal}</td>
                        <td className="py-1 px-2 text-slate-500 font-medium bg-slate-50/70 border-r border-slate-200">{t.khata}</td>
                        <td className="py-1 px-2 text-slate-900">{t.khataVal}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 7. Section 4: VERIFICATION & DATA SOURCES */}
                <div className="border border-slate-300 rounded-sm overflow-hidden font-sans text-[11px]">
                  <div className="bg-[#1e3a5f] text-white font-bold text-[10px] uppercase px-2.5 py-1 tracking-wider">
                    {t.sec4}
                  </div>
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="w-[20%] py-1 px-2 text-slate-500 font-medium bg-slate-50/70 border-r border-slate-200">{t.dataSources}</td>
                        <td colSpan={3} className="py-1 px-2 text-slate-800 leading-tight">{t.dataSourcesVal}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="py-1 px-2 text-slate-500 font-medium bg-slate-50/70 border-r border-slate-200">{t.verStatus}</td>
                        <td colSpan={3} className="py-1 px-2 text-[#1e3a5f] font-bold text-xs">{t.verStatusVal}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="py-1 px-2 text-slate-500 font-medium bg-slate-50/70 border-r border-slate-200">{t.verDate}</td>
                        <td className="py-1 px-2 text-slate-900 font-medium border-r border-slate-200">{t.verDateVal}</td>
                        <td className="py-1 px-2 text-slate-500 font-medium bg-slate-50/70 border-r border-slate-200">{t.verBy}</td>
                        <td className="py-1 px-2 text-slate-900 font-medium">{t.verByVal}</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2 text-slate-500 font-medium bg-slate-50/70 border-r border-slate-200">{t.remarks}</td>
                        <td colSpan={3} className="py-1 px-2 text-slate-700 leading-snug text-[10.5px]">{t.remarksVal}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 8. Bottom Seal, Authorized Signature & Disclaimer */}
              <div className="pt-4 mt-4 border-t border-slate-300 relative z-10 font-sans">
                <div className="flex items-center justify-between px-2">
                  {/* Official Blue Circular Stamp */}
                  <div className="flex items-center gap-2">
                    <div className="relative w-24 h-24 flex items-center justify-center select-none">
                      <svg viewBox="0 0 160 160" className="w-full h-full text-[#1e3a8a]">
                        <circle cx="80" cy="80" r="74" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 2" />
                        <circle cx="80" cy="80" r="68" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        <path id="curveTop" d="M 22 80 A 58 58 0 0 1 138 80" fill="none" stroke="none" />
                        <text fontSize="7.5" fontWeight="bold" fill="currentColor" letterSpacing="0.8">
                          <textPath href="#curveTop" startOffset="50%" textAnchor="middle">
                            REVENUE &amp; CADASTRAL MAPPING DEPARTMENT
                          </textPath>
                        </text>
                        <path id="curveBottom" d="M 138 80 A 58 58 0 0 1 22 80" fill="none" stroke="none" />
                        <text fontSize="8.5" fontWeight="bold" fill="currentColor" letterSpacing="1.2">
                          <textPath href="#curveBottom" startOffset="50%" textAnchor="middle">
                            ★ UTTAR PRADESH ★
                          </textPath>
                        </text>
                        <circle cx="80" cy="80" r="42" fill="none" stroke="currentColor" strokeWidth="1.2" />
                        <g transform="translate(68, 54) scale(0.24)">
                          <path d="M50 5 C52 5, 54 7, 54 10 C54 12, 52 14, 50 14 C48 14, 46 12, 46 10 C46 7, 48 5, 50 5 Z" fill="currentColor" />
                          <path d="M40 18 C45 15, 55 15, 60 18 C65 22, 63 32, 60 36 C57 39, 53 40, 50 40 C47 40, 43 39, 40 36 C37 32, 35 22, 40 18 Z" fill="currentColor" />
                          <rect x="22" y="52" width="56" height="8" rx="2" fill="currentColor" />
                        </g>
                        <text x="80" y="94" textAnchor="middle" fontSize="13" fontWeight="900" fill="currentColor" letterSpacing="1">DEMO</text>
                      </svg>
                    </div>
                  </div>

                  {/* Digital Signature */}
                  <div className="flex flex-col items-center text-center">
                    {/* Scribble Signature Vector */}
                    <div className="w-32 h-10 flex items-center justify-center">
                      <svg viewBox="0 0 140 45" className="w-full h-full text-slate-800">
                        <path
                          d="M10 32 C25 15, 30 5, 35 22 C40 38, 48 12, 55 18 C62 25, 70 8, 78 20 C85 30, 92 14, 102 26 C110 18, 125 16, 135 24 M40 28 L115 28"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="w-40 border-t border-slate-700/80 pt-1 text-[10px] leading-tight text-slate-800">
                      <div className="font-bold">{t.authOfficer}</div>
                      <div className="text-[9px] text-slate-600 leading-tight whitespace-pre-line">
                        {t.authDept}
                        {'\n'}
                        {t.authGovt}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Legal Disclaimer */}
                <div className="text-center text-[8px] text-slate-500 font-mono tracking-widest uppercase border-t border-slate-200 pt-2 mt-2">
                  {t.disclaimer}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
