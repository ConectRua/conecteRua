import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { UBS, ONG, Paciente, EquipamentoSocial } from '../../../shared/schema';

interface ExportDropdownProps {
  ubsList: UBS[];
  ongsList: ONG[];
  pacientesList: Paciente[];
  equipamentosSociais: EquipamentoSocial[];
}

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return "N/A";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === 'boolean') return value ? "Sim" : "Não";
  if (value instanceof Date) return value.toLocaleDateString('pt-BR');
  return String(value);
};

const formatCEP = (cep: string | null | undefined): string => {
  if (!cep) return "N/A";
  const cleaned = cep.replace(/\D/g, '');
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  }
  return cep;
};

const formatCoordinate = (coord: number | null | undefined): string => {
  if (coord === null || coord === undefined) return "N/A";
  return coord.toFixed(6);
};

const getCurrentDate = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

export function ExportDropdown({ ubsList, ongsList, pacientesList, equipamentosSociais }: ExportDropdownProps) {
  
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    
    const ubsData = ubsList.map(ubs => ({
      'ID': ubs.id,
      'Nome': ubs.nome,
      'Endereço': ubs.endereco,
      'CEP': formatCEP(ubs.cep),
      'Latitude': formatCoordinate(ubs.latitude),
      'Longitude': formatCoordinate(ubs.longitude),
      'Telefone': formatValue(ubs.telefone),
      'Email': formatValue(ubs.email),
      'Horário de Funcionamento': formatValue(ubs.horarioFuncionamento),
      'Especialidades': formatValue(ubs.especialidades),
      'Gestor': formatValue(ubs.gestor),
      'Avaliação Google': formatValue(ubs.googleRating),
      'Ativo': formatValue(ubs.ativo),
    }));
    
    const ongsData = ongsList.map(ong => ({
      'ID': ong.id,
      'Nome': ong.nome,
      'Endereço': ong.endereco,
      'CEP': formatCEP(ong.cep),
      'Latitude': formatCoordinate(ong.latitude),
      'Longitude': formatCoordinate(ong.longitude),
      'Telefone': formatValue(ong.telefone),
      'Email': formatValue(ong.email),
      'Site': formatValue(ong.site),
      'Tipo': formatValue(ong.tipo),
      'Áreas de Atuação': formatValue(ong.areasAtuacao),
      'Horário de Funcionamento': formatValue(ong.horarioFuncionamento),
      'Serviços': formatValue(ong.servicos),
      'Responsável': formatValue(ong.responsavel),
      'Avaliação Google': formatValue(ong.googleRating),
      'Ativo': formatValue(ong.ativo),
    }));
    
    const pacientesData = pacientesList.map(paciente => ({
      'ID': paciente.id,
      'Nome': paciente.nome,
      'Nome Social': formatValue(paciente.nomeSocial),
      'Nome da Mãe': formatValue(paciente.nomeMae),
      'Data de Nascimento': formatValue(paciente.dataNascimento),
      'Idade': formatValue(paciente.idade),
      'CNS/CPF': formatValue(paciente.cnsOuCpf),
      'Endereço': paciente.endereco,
      'CEP': formatCEP(paciente.cep),
      'Latitude': formatCoordinate(paciente.latitude),
      'Longitude': formatCoordinate(paciente.longitude),
      'Telefone': formatValue(paciente.telefone),
      'Identidade de Gênero': formatValue(paciente.identidadeGenero),
      'Cor/Raça': formatValue(paciente.corRaca),
      'Orientação Sexual': formatValue(paciente.orientacaoSexual),
      'Condições de Saúde': formatValue(paciente.condicoesSaude),
      'Observações': formatValue(paciente.observacoes),
      'Ativo': formatValue(paciente.ativo),
    }));
    
    const equipamentosData = equipamentosSociais.map(eq => ({
      'ID': eq.id,
      'Nome': eq.nome,
      'Tipo': eq.tipo,
      'Endereço': eq.endereco,
      'CEP': formatCEP(eq.cep),
      'Latitude': formatCoordinate(eq.latitude),
      'Longitude': formatCoordinate(eq.longitude),
      'Telefone': formatValue(eq.telefone),
      'Email': formatValue(eq.email),
      'Horário de Funcionamento': formatValue(eq.horarioFuncionamento),
      'Serviços': formatValue(eq.servicos),
      'Responsável': formatValue(eq.responsavel),
      'Avaliação Google': formatValue(eq.googleRating),
      'Ativo': formatValue(eq.ativo),
    }));
    
    const ubsSheet = XLSX.utils.json_to_sheet(ubsData);
    const ongsSheet = XLSX.utils.json_to_sheet(ongsData);
    const pacientesSheet = XLSX.utils.json_to_sheet(pacientesData);
    const equipamentosSheet = XLSX.utils.json_to_sheet(equipamentosData);
    
    const headerStyle = {
      font: { bold: true }
    };
    
    [ubsSheet, ongsSheet, pacientesSheet, equipamentosSheet].forEach(sheet => {
      const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!sheet[cellAddress]) continue;
        sheet[cellAddress].s = headerStyle;
      }
    });
    
    XLSX.utils.book_append_sheet(workbook, ubsSheet, "UBS");
    XLSX.utils.book_append_sheet(workbook, ongsSheet, "ONGs");
    XLSX.utils.book_append_sheet(workbook, pacientesSheet, "Pacientes");
    XLSX.utils.book_append_sheet(workbook, equipamentosSheet, "Equipamentos Sociais");
    
    const fileName = `georeferenciamento_${getCurrentDate()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };
  
  const exportToCSV = () => {
    let csvContent = "";
    
    csvContent += "UNIDADES BÁSICAS DE SAÚDE (UBS)\n";
    csvContent += "ID,Nome,Endereço,CEP,Latitude,Longitude,Telefone,Email,Horário de Funcionamento,Especialidades,Gestor,Avaliação Google,Ativo\n";
    ubsList.forEach(ubs => {
      csvContent += `${ubs.id},"${ubs.nome}","${ubs.endereco}",${formatCEP(ubs.cep)},${formatCoordinate(ubs.latitude)},${formatCoordinate(ubs.longitude)},"${formatValue(ubs.telefone)}","${formatValue(ubs.email)}","${formatValue(ubs.horarioFuncionamento)}","${formatValue(ubs.especialidades)}","${formatValue(ubs.gestor)}",${formatValue(ubs.googleRating)},${formatValue(ubs.ativo)}\n`;
    });
    
    csvContent += "\n";
    csvContent += "ORGANIZAÇÕES NÃO GOVERNAMENTAIS (ONGs)\n";
    csvContent += "ID,Nome,Endereço,CEP,Latitude,Longitude,Telefone,Email,Site,Tipo,Áreas de Atuação,Horário de Funcionamento,Serviços,Responsável,Avaliação Google,Ativo\n";
    ongsList.forEach(ong => {
      csvContent += `${ong.id},"${ong.nome}","${ong.endereco}",${formatCEP(ong.cep)},${formatCoordinate(ong.latitude)},${formatCoordinate(ong.longitude)},"${formatValue(ong.telefone)}","${formatValue(ong.email)}","${formatValue(ong.site)}","${formatValue(ong.tipo)}","${formatValue(ong.areasAtuacao)}","${formatValue(ong.horarioFuncionamento)}","${formatValue(ong.servicos)}","${formatValue(ong.responsavel)}",${formatValue(ong.googleRating)},${formatValue(ong.ativo)}\n`;
    });
    
    csvContent += "\n";
    csvContent += "PACIENTES\n";
    csvContent += "ID,Nome,Nome Social,Nome da Mãe,Data de Nascimento,Idade,CNS/CPF,Endereço,CEP,Latitude,Longitude,Telefone,Identidade de Gênero,Cor/Raça,Orientação Sexual,Condições de Saúde,Observações,Ativo\n";
    pacientesList.forEach(paciente => {
      csvContent += `${paciente.id},"${paciente.nome}","${formatValue(paciente.nomeSocial)}","${formatValue(paciente.nomeMae)}",${formatValue(paciente.dataNascimento)},${formatValue(paciente.idade)},"${formatValue(paciente.cnsOuCpf)}","${paciente.endereco}",${formatCEP(paciente.cep)},${formatCoordinate(paciente.latitude)},${formatCoordinate(paciente.longitude)},"${formatValue(paciente.telefone)}","${formatValue(paciente.identidadeGenero)}","${formatValue(paciente.corRaca)}","${formatValue(paciente.orientacaoSexual)}","${formatValue(paciente.condicoesSaude)}","${formatValue(paciente.observacoes)}",${formatValue(paciente.ativo)}\n`;
    });
    
    csvContent += "\n";
    csvContent += "EQUIPAMENTOS SOCIAIS\n";
    csvContent += "ID,Nome,Tipo,Endereço,CEP,Latitude,Longitude,Telefone,Email,Horário de Funcionamento,Serviços,Responsável,Avaliação Google,Ativo\n";
    equipamentosSociais.forEach(eq => {
      csvContent += `${eq.id},"${eq.nome}","${eq.tipo}","${eq.endereco}",${formatCEP(eq.cep)},${formatCoordinate(eq.latitude)},${formatCoordinate(eq.longitude)},"${formatValue(eq.telefone)}","${formatValue(eq.email)}","${formatValue(eq.horarioFuncionamento)}","${formatValue(eq.servicos)}","${formatValue(eq.responsavel)}",${formatValue(eq.googleRating)},${formatValue(eq.ativo)}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `georeferenciamento_${getCurrentDate()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Relatório de Georeferenciamento', 14, 20);
    
    let yPosition = 30;
    
    doc.setFontSize(14);
    doc.text('Unidades Básicas de Saúde (UBS)', 14, yPosition);
    yPosition += 5;
    
    const ubsTableData = ubsList.map(ubs => [
      ubs.id,
      ubs.nome,
      ubs.endereco,
      formatCEP(ubs.cep),
      formatCoordinate(ubs.latitude),
      formatCoordinate(ubs.longitude),
      formatValue(ubs.telefone),
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['ID', 'Nome', 'Endereço', 'CEP', 'Latitude', 'Longitude', 'Telefone']],
      body: ubsTableData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 8 },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
    
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(14);
    doc.text('Organizações Não Governamentais (ONGs)', 14, yPosition);
    yPosition += 5;
    
    const ongsTableData = ongsList.map(ong => [
      ong.id,
      ong.nome,
      ong.endereco,
      formatCEP(ong.cep),
      formatCoordinate(ong.latitude),
      formatCoordinate(ong.longitude),
      formatValue(ong.telefone),
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['ID', 'Nome', 'Endereço', 'CEP', 'Latitude', 'Longitude', 'Telefone']],
      body: ongsTableData,
      theme: 'grid',
      headStyles: { fillColor: [46, 204, 113] },
      styles: { fontSize: 8 },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
    
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(14);
    doc.text('Pacientes', 14, yPosition);
    yPosition += 5;
    
    const pacientesTableData = pacientesList.map(paciente => [
      paciente.id,
      paciente.nome,
      paciente.endereco,
      formatCEP(paciente.cep),
      formatCoordinate(paciente.latitude),
      formatCoordinate(paciente.longitude),
      formatValue(paciente.telefone),
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['ID', 'Nome', 'Endereço', 'CEP', 'Latitude', 'Longitude', 'Telefone']],
      body: pacientesTableData,
      theme: 'grid',
      headStyles: { fillColor: [231, 76, 60] },
      styles: { fontSize: 8 },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
    
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(14);
    doc.text('Equipamentos Sociais', 14, yPosition);
    yPosition += 5;
    
    const equipamentosTableData = equipamentosSociais.map(eq => [
      eq.id,
      eq.nome,
      eq.tipo,
      eq.endereco,
      formatCEP(eq.cep),
      formatCoordinate(eq.latitude),
      formatCoordinate(eq.longitude),
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['ID', 'Nome', 'Tipo', 'Endereço', 'CEP', 'Latitude', 'Longitude']],
      body: equipamentosTableData,
      theme: 'grid',
      headStyles: { fillColor: [155, 89, 182] },
      styles: { fontSize: 8 },
    });
    
    doc.save(`georeferenciamento_${getCurrentDate()}.pdf`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" data-testid="dropdown-export">
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={exportToExcel} data-testid="item-export-excel">
          📊 Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToCSV} data-testid="item-export-csv">
          📄 CSV (.csv)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF} data-testid="item-export-pdf">
          📋 PDF (.pdf)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
