interface DocumentContentProps {
  academyName: string;
}

export function DocumentContent({ academyName }: DocumentContentProps) {
  return (
    <div className="p-8 text-sm text-gray-800 leading-relaxed space-y-4">
      <p>
        Con la firma de este documento, el alumno se compromete al pago total de la asignatura
        indicada en las líneas anteriores. Las faltas de asistencia no afectarán al coste del
        curso en el que se matricule.
      </p>
      <p>
        El alumno deberá comprometerse a asistir en directo en el horario en el que se impartan
        las clases programadas de la asignatura. Dicha asistencia será responsabilidad del alumno.
      </p>
      <p>
        <strong>{academyName}</strong>, por su parte, se compromete a impartir todas las clases
        pactadas a la firma de este contrato.
      </p>
      <p>
        El alumno se compromete a mantener para uso exclusivamente personal la documentación
        impresa o digital que se pone a su disposición a través del portal de la asignatura o en
        el aula, propiedad intelectual de <strong>{academyName}</strong>.
      </p>

      <h3 className="font-bold text-base pt-4 border-t border-gray-200">
        Cláusulas sobre propiedad intelectual para cursos online
      </h3>
      <p className="italic border-l-4 border-gray-300 pl-4 text-gray-600">
        &ldquo;Los delitos contra la propiedad intelectual, se encuentran tipificados en los
        artículos 270 a 272 del Código Penal.&rdquo;
      </p>
      <p>
        Los elementos de la propiedad intelectual son, los derechos de carácter personal y los
        patrimoniales que atribuyen al autor la plena disposición de su obra y el derecho exclusivo
        a su explotación con fines económicos, así como la paternidad de la obra.
      </p>
      <p>
        El alumno reconoce la propiedad intelectual de <strong>{academyName}</strong> sobre las
        clases a las que se inscribe, y acepta pactar este acuerdo en el que se compromete a no
        realizar ningún tipo de grabación de las mismas. En caso de actuar contra este acuerdo, y
        como compensación de la falta, el alumno se compromete a una compensación económica a favor
        del representante de <strong>{academyName}</strong> de{' '}
        <strong>3.000 (Tres Mil) euros</strong> en caso de realizar cualquier tipo de grabación de
        pantalla, y de un mínimo de <strong>20.000 (Veinte Mil) euros</strong> en caso de
        compartirlo con una tercera persona. Estas cantidades se entenderán en ambos casos como
        indemnización mínima, y se elevarán en función de la cantidad de material grabado y/o
        distribuido.
      </p>
      <p>
        De la misma manera, el alumno se compromete a mantener para uso exclusivamente personal la
        documentación digital que se pone a su disposición a través del portal de la asignatura,
        propiedad intelectual de <strong>{academyName}</strong>.
      </p>
      <p>
        Los cursos, tanto presenciales como online, están organizados para atenderlos en directo,
        por lo que salvo causa excepcional y justificada que impidan realmente el no poder asistir
        a las clases, no se facilitará acceso a las grabaciones de las clases perdidas.
      </p>
      <p>
        En caso de realizar el curso online, es obligatorio disponer de una cámara web funcional,
        y tenerla en todo momento activa enfocando a la cara completa y el entorno. Caso contrario,
        el programa expulsará al alumno de la sesión.
      </p>
      <p>
        El pago de esta matrícula cubre la inscripción y atención a las clases de un solo alumno,
        en caso de que haya un segundo alumno atendiendo a las clases al otro lado del ordenador,
        se podrá expulsar al alumno del curso con la pérdida de la matrícula pagada, sin perjuicio
        de que se reclame el pago del segundo alumno.
      </p>

      <h3 className="font-bold text-base pt-4 border-t border-gray-200">
        Consentimiento Expreso
      </h3>
      <p>
        En aras a dar cumplimiento al Reglamento (UE) 2016/679 del Parlamento Europeo y del
        Consejo, de 27 de abril de 2016, relativo a la protección de las personas físicas en lo
        que respecta al tratamiento de datos personales y a la libre circulación de estos datos, y
        siguiendo las Recomendaciones e Instrucciones emitidas por la Agencia Española de
        Protección de Datos (A.E.P.D.), SE INFORMA:
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          Los datos de carácter personal solicitados y facilitados por usted, son incorporados a un
          fichero de titularidad privada cuyo responsable y único destinatario es{' '}
          <strong>{academyName}</strong>.
        </li>
        <li>
          Solo serán solicitados aquellos datos estrictamente necesarios para prestar adecuadamente
          los servicios solicitados, pudiendo ser necesario recoger datos de contacto de terceros,
          tales como representantes legales, tutores, o personas a cargo designadas por los mismos.
        </li>
        <li>
          Todos los datos recogidos cuentan con el compromiso de confidencialidad, con las medidas
          de seguridad establecidas legalmente, y bajo ningún concepto son cedidos o tratados por
          terceras personas, físicas o jurídicas, sin el previo consentimiento del cliente, tutor o
          representante legal, salvo en aquellos casos en los que fuere imprescindible para la
          correcta prestación del servicio.
        </li>
        <li>
          Una vez finalizada la relación entre la empresa y el cliente los datos serán archivados y
          conservados, durante un periodo tiempo mínimo de 1 año, tras lo cual seguirá archivado o
          en su defecto serán devueltos íntegramente al cliente o autorizado legal.
        </li>
        <li>
          Los datos que facilito serán incluidos en el Tratamiento denominado Clientes de{' '}
          <strong>{academyName}</strong>, con la finalidad de gestión del servicio contratado,
          emisión de facturas, contacto y todas las gestiones relacionadas con los clientes, y
          manifiesto mi consentimiento. También se me ha informado de la posibilidad de ejercitar
          los derechos de acceso, rectificación, cancelación y oposición, indicándolo por escrito a{' '}
          <strong>{academyName}</strong>.
        </li>
        <li>
          Los datos personales serán cedidos por <strong>{academyName}</strong> a los profesores
          que prestan servicios a la misma.
        </li>
      </ul>
    </div>
  );
}
