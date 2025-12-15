import Image from 'next/image';
import Link from 'next/link';
import { FaFacebook, FaLinkedin, FaInstagram } from 'react-icons/fa';

export const Footer = () => {
    return (
        <footer className="bg-[#361951] text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                    <div className="flex-shrink-0">
                        <Image
                            src="/logo-footer-nutrabiotics.png"
                            alt="Logo Nutrabiotics"
                            width={180}
                            height={50}
                            className="h-12 w-auto"
                        />
                    </div>

                    <div className="flex items-center gap-6">
                        <Link
                            href="https://www.facebook.com/Nutrabiotics"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white hover:text-[#1778F2] transition-colors duration-200"
                            aria-label="Facebook"
                        >
                            <FaFacebook size={28} />
                        </Link>
                        <Link
                            href="https://co.linkedin.com/company/nutrabiotics-sas"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white hover:text-[#0e76a8] transition-colors duration-200"
                            aria-label="LinkedIn"
                        >
                            <FaLinkedin size={28} />
                        </Link>
                        <Link
                            href="https://www.instagram.com/nutrabiotics_mf/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white hover:text-[#c13584] transition-colors duration-200"
                            aria-label="Instagram"
                        >
                            <FaInstagram size={28} />
                        </Link>
                    </div>
                </div>

                <div className="border-t border-white/20 mb-8"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8 text-center md:text-left">
                    <div>
                        <h3 className="text-[#e6a63e] font-bold text-lg mb-4">Atención</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="#" className="hover:text-[#e6a63e] transition-colors duration-200">
                                    PQRSF
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-[#e6a63e] transition-colors duration-200">
                                    Políticas
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-[#e6a63e] transition-colors duration-200">
                                    Calidad y certificados
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-[#e6a63e] transition-colors duration-200">
                                    Farmacovigilancia
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-[#e6a63e] font-bold text-lg mb-4">De interés</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="#" className="hover:text-[#e6a63e] transition-colors duration-200">
                                    Ilumina
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-[#e6a63e] transition-colors duration-200">
                                    Alivia
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-[#e6a63e] transition-colors duration-200">
                                    Eventos
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-[#e6a63e] transition-colors duration-200">
                                    Zona educativa
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-[#e6a63e] transition-colors duration-200">
                                    Clientes GDOC
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-[#e6a63e] font-bold text-lg mb-4">Contact center</h3>
                        <ul className="space-y-2">
                            <li>
                                <span className="font-semibold">Bogotá:</span> 601 443 0900
                            </li>
                            <li>
                                <span className="font-semibold">Cali:</span> 602 380 8906
                            </li>
                            <li>
                                <span className="font-semibold">Medellín:</span> 604 283 6948
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-[#e6a63e] font-bold text-lg mb-4">Horarios de atención</h3>
                        <div className="space-y-3">
                            <div>
                                <p className="font-semibold">Lunes a viernes</p>
                                <p className="text-sm">8:00 AM a 6:00 PM</p>
                            </div>
                            <div>
                                <p className="font-semibold">Sábados</p>
                                <p className="text-sm">8:00 AM a 1:00 PM</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-[#e6a63e] font-bold text-lg mb-4">Certificados</h3>
                        <p className="text-sm mb-3">
                            Certificaciones del laboratorio de fabricación
                        </p>
                        <p className="text-sm mb-2">
                            NUTRABIOTICS SAS cuenta con certificados en:
                        </p>
                        <ul className="space-y-1 text-sm">
                            <li>ICONTEC</li>
                            <li>IQNET</li>
                            <li>SC-CER726258</li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/20 pt-6 text-center text-sm">
                    <p>&copy; {new Date().getFullYear()} Nutrabiotics SAS. Todos los derechos reservados.</p>
                </div>
            </div>
        </footer>
    );
};
